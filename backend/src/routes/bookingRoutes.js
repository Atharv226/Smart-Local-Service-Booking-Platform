import express from 'express';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import Customer from '../models/Customer.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get booking by id for either customer or provider (authorization check)
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate({
        path: 'customer',
        populate: { path: 'user', select: 'fullName mobileNumber' }
      })
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'fullName mobileNumber' }
      });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isCustomer = await Customer.findOne({ _id: booking.customer, user: req.user.id });
    const isProvider = await Provider.findOne({ _id: booking.provider, user: req.user.id });

    if (!isCustomer && !isProvider && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed to view this booking' });
    }

    return res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Provider marks booking as completed
router.post('/:id/complete', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(403).json({ message: 'Only providers can complete bookings' });

    const booking = await Booking.findOne({ _id: id, provider: provider._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'completed';
    await booking.save();

    // Emit Socket.IO event for completion
    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${id}`).emit('booking:status-changed', {
        bookingId: id,
        status: 'completed',
        timestamp: new Date(),
      });
    }

    return res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Customer confirms the price range
router.post('/:id/confirm-price', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accepted } = req.body;

    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(403).json({ message: 'Only customers can confirm price' });

    const booking = await Booking.findOne({ _id: id, customer: customer._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (accepted) {
      booking.isPriceAccepted = true;
      booking.isLocationShared = true; // Share location upon price acceptance
      
      // Emit event to notify provider
      const io = req.app.get('io');
      if (io) {
        // Notify provider
        const provider = await Provider.findById(booking.provider);
        if (provider && provider.user) {
          io.to(`user_${provider.user}`).emit('booking:price-confirmed', {
            bookingId: id,
            message: 'Customer accepted the price range. Location sharing enabled.',
            timestamp: new Date(),
          });
        }
      }
    } else {
       // If rejected, maybe update status to cancelled or rejected?
       booking.status = 'rejected';
       booking.isPriceAccepted = false;
    }

    await booking.save();
    return res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Generate comprehensive QR payload for a booking (called by provider)
router.post('/:id/generate-qr', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findOne({ user: req.user.id }).populate('user');
    if (!provider) return res.status(403).json({ message: 'Only providers can generate QR' });

    const booking = await Booking.findOne({ _id: id, provider: provider._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Include more provider info as requested
    const payload = {
      bookingId: booking._id.toString(),
      providerId: provider._id.toString(),
      blockchainProviderId: provider.blockchainProviderId,
      name: provider.user.fullName,
      serviceType: provider.serviceType,
      specialization: provider.specialization,
      experience: provider.experienceYears,
      rating: provider.rating,
      timestamp: Date.now()
    };

    const payloadString = JSON.stringify(payload);
    booking.verificationQrData = payloadString;
    await booking.save();

    return res.json({ qrData: payloadString });
  } catch (err) {
    next(err);
  }
});

// Verify QR payload (called by customer after scanning)
router.post('/verify-qr', authRequired, async (req, res, next) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ message: 'Missing qrData' });

    const parsed = JSON.parse(qrData);
    if (!parsed?.bookingId) {
      return res.status(400).json({ message: 'Invalid QR payload: missing bookingId' });
    }

    const booking = await Booking.findById(parsed.bookingId)
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'fullName mobileNumber role' },
      })
      .populate({
        path: 'customer',
        populate: { path: 'user', select: 'fullName mobileNumber role' },
      });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Basic consistency checks
    if (
      booking.provider?._id?.toString() !== parsed.providerId ||
      booking.provider?.blockchainProviderId !== parsed.blockchainProviderId
    ) {
      return res.status(400).json({ message: 'QR verification failed' });
    }

    booking.verifiedAt = new Date();
    await booking.save();

    const provider = booking.provider;

    return res.json({
      verified: true,
      bookingId: booking._id,
      providerLocation: provider?.currentLocation || null,
      provider: provider
        ? {
            _id: provider._id,
            blockchainProviderId: provider.blockchainProviderId,
            age: provider.age,
            serviceType: provider.serviceType,
            specialization: provider.specialization,
            identityProof: provider.identityProof,
            serviceArea: provider.serviceArea,
            availableTimings: provider.availableTimings,
            experienceYears: provider.experienceYears,
            rating: provider.rating,
            totalJobs: provider.totalJobs,
            emergencyService: provider.emergencyService,
            user: provider.user,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// Submit review for a completed booking
router.post('/:id/review', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(403).json({ message: 'Only customers can submit reviews' });

    const booking = await Booking.findOne({ _id: id, customer: customer._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    // Update provider stats
    const provider = await Provider.findById(booking.provider);
    if (provider) {
      provider.ratingCount = (provider.ratingCount || 0) + 1;
      // Incremental average update: newAvg = oldAvg + (newVal - oldAvg) / newCount
      provider.rating = provider.rating + (rating - provider.rating) / provider.ratingCount;
      await provider.save();
    }

    return res.json({ message: 'Review submitted successfully', booking });
  } catch (err) {
    next(err);
  }
});

export default router;


