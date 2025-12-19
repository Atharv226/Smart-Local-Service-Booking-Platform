import express from 'express';
import Provider from '../models/Provider.js';
import Booking from '../models/Booking.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get provider profile for current user
router.get('/me', authRequired, requireRole('provider'), async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    return res.json(provider);
  } catch (err) {
    next(err);
  }
});

// Update provider profile (all fields)
router.put('/me', authRequired, requireRole('provider'), async (req, res, next) => {
  try {
    // Allow updating all provider fields
    const allowedFields = [
      'serviceArea',
      'availableTimings',
      'experienceYears',
      'emergencyService',
      'specialization',
      'serviceType',
      'age',
      'identityProof',
    ];
    
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Ensure experienceYears is a number
    if (updates.experienceYears !== undefined) {
      updates.experienceYears = Number(updates.experienceYears) || 0;
    }

    // Ensure age is a number
    if (updates.age !== undefined) {
      updates.age = Number(updates.age) || 0;
    }

    // Ensure emergencyService is a boolean
    if (updates.emergencyService !== undefined) {
      updates.emergencyService = Boolean(updates.emergencyService);
    }

    console.log('💾 Saving provider profile updates:', updates);

    const provider = await Provider.findOneAndUpdate(
      { user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    console.log('✅ Provider profile updated successfully:', provider._id);
    return res.json(provider);
  } catch (err) {
    console.error('❌ Error updating provider profile:', err);
    next(err);
  }
});

// List incoming job requests for this provider
router.get('/jobs', authRequired, requireRole('provider'), async (req, res, next) => {
  try {
    console.log('🔍 GET /jobs request received for user:', req.user.id);
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) {
      console.log('❌ Provider profile not found for user:', req.user.id);
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    console.log('✅ Found provider:', provider._id);

    const jobs = await Booking.find({ 
      $or: [
        { provider: provider._id },
        // Safety: include any bookings accidentally stored with the provider's user id
        { provider: provider.user }
      ]
    })
      .populate({
        path: 'customer',
        populate: {
          path: 'user',
          select: 'fullName mobileNumber',
        },
      })
      .sort({ createdAt: -1 });
     
    console.log(`📋 Found ${jobs.length} jobs for provider ${provider._id}`);

    return res.json(jobs);
  } catch (err) {
    console.error('❌ Error fetching jobs:', err);
    next(err);
  }
});

// Accept or reject a job
router.post('/jobs/:bookingId/decision', authRequired, requireRole('provider'), async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { decision, amount } = req.body; // 'accept' or 'reject'

    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

  const booking = await Booking.findOne({
    _id: bookingId,
    $or: [
      { provider: provider._id },
      // Safety: include bookings accidentally stored with provider's user id
      { provider: provider.user },
    ],
  }).populate('customer');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (decision === 'accept') {
      booking.status = 'accepted';
      
      // Handle exact amount or price range
      if (req.body.priceMin && req.body.priceMax) {
        booking.priceRange = {
          min: Number(req.body.priceMin),
          max: Number(req.body.priceMax)
        };
        // Reset confirmation flags but enable location sharing immediately
        booking.isPriceAccepted = false;
        booking.isLocationShared = true;
      } else if (amount) {
        booking.amount = Number(amount);
        booking.isLocationShared = true;
      }
    } else if (decision === 'reject') {
      booking.status = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    await booking.save();
    
    // Emit Socket.IO event for real-time status update
    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${bookingId}`).emit('booking:status-changed', {
        bookingId,
        status: booking.status,
        timestamp: new Date(),
      });
      
      // Notify customer
      if (booking.customer?.user) {
        let message = `Booking ${booking.status} by provider`;
        if (booking.priceRange && booking.priceRange.min) {
          message += ` with price range ₹${booking.priceRange.min} - ₹${booking.priceRange.max}`;
        } else if (booking.amount) {
          message += ` for ₹${booking.amount}`;
        }

        io.to(`user_${booking.customer.user}`).emit('booking:notification', {
          bookingId,
          status: booking.status,
          message,
          amount: booking.amount,
          priceRange: booking.priceRange,
          timestamp: new Date(),
        });
      }
    }
    
    return res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Update provider current location (for tracking)
router.post('/location', authRequired, requireRole('provider'), async (req, res, next) => {
  try {
    const { lat, lng, bookingId } = req.body;
    const provider = await Provider.findOneAndUpdate(
      { user: req.user.id },
      { currentLocation: { lat, lng } },
      { new: true }
    );
    
    // Emit Socket.IO event for real-time location updates
    const io = req.app.get('io');
    if (io && bookingId) {
      io.to(`booking_${bookingId}`).emit('provider:location', {
        bookingId,
        lat,
        lng,
        providerId: provider._id,
        timestamp: new Date(),
      });
    }
    
    return res.json(provider);
  } catch (err) {
    next(err);
  }
});

// Verify provider digital-id QR (called by customer after scanning)
// Accepts either a raw blockchainProviderId string or a JSON payload containing blockchainProviderId/providerId.
router.post('/verify-qr', authRequired, async (req, res, next) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ message: 'Missing qrData' });

    let blockchainProviderId = null;

    try {
      const parsed = JSON.parse(qrData);
      blockchainProviderId = parsed?.blockchainProviderId || parsed?.providerId || null;
    } catch {
      // Not JSON: treat qrData as the blockchain provider id
      blockchainProviderId = qrData;
    }

    if (!blockchainProviderId) {
      return res.status(400).json({ message: 'Invalid QR payload' });
    }

    const provider = await Provider.findOne({ blockchainProviderId }).populate('user', 'fullName mobileNumber role');
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    return res.json({
      verified: true,
      providerLocation: provider.currentLocation || null,
      provider: {
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
      },
    });
  } catch (err) {
    next(err);
  }
});

// Simple payout summary mock for provider
router.get('/payout-summary', authRequired, requireRole('provider'), async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    const completedBookings = await Booking.find({ provider: provider._id, status: 'completed' });
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    return res.json({
      totalEarnings,
      jobsCompleted: completedBookings.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;


