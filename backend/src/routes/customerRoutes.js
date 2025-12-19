import express from 'express';
import Provider from '../models/Provider.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current customer profile
router.get('/me', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id });
    return res.json(customer);
  } catch (err) {
    next(err);
  }
});

// Update customer profile (all fields)
router.put('/me', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    // Allow updating all customer fields
    const allowedFields = ['address', 'email', 'servicePreference', 'lat', 'lng'];
    
    const updates = {};
    
    // Handle address
    if (req.body.address !== undefined) {
      updates.address = req.body.address;
    }
    
    // Handle email
    if (req.body.email !== undefined) {
      updates.email = req.body.email || '';
    }
    
    // Handle servicePreference
    if (req.body.servicePreference !== undefined) {
      updates.servicePreference = req.body.servicePreference;
    }
    
    // Handle location (lat, lng)
    if (req.body.lat !== undefined || req.body.lng !== undefined) {
      updates.location = {
        lat: req.body.lat !== undefined ? Number(req.body.lat) : null,
        lng: req.body.lng !== undefined ? Number(req.body.lng) : null,
      };
    }

    console.log('💾 Saving customer profile updates:', updates);

    const customer = await Customer.findOneAndUpdate(
      { user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    console.log('✅ Customer profile updated successfully:', customer._id);
    return res.json(customer);
  } catch (err) {
    console.error('❌ Error updating customer profile:', err);
    next(err);
  }
});

// Search local service providers by serviceType + area (very simple filter)
router.get('/providers/search', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const { serviceType, serviceArea, companyName } = req.query;

    // Get customer profile to match by location
    const customer = await Customer.findOne({ user: req.user.id });
    const customerArea = customer?.address ? customer.address.split(',')[0] : null;

    const query = {};
    if (serviceType) query.serviceType = serviceType;
    
    // Match by service area - prioritize customer's location
    const searchArea = serviceArea || customerArea || '';
    if (searchArea) {
      query.serviceArea = new RegExp(searchArea, 'i');
    }

    // Company-based providers would normally be flagged differently; for demo we reuse same model
    if (companyName) {
      query.serviceArea = new RegExp(companyName, 'i');
    }

    let providers = await Provider.find(query)
      .populate('user', 'fullName mobileNumber')
      .sort({ rating: -1, totalJobs: -1 });
    
    // Fallback: If no providers found with strict location filter, try relaxing the location filter
    // This ensures the user sees *some* providers instead of an empty list
    if (providers.length === 0 && (serviceArea || customerArea) && !companyName) {
      console.log('⚠️ No providers found in area, relaxing location filter...');
      delete query.serviceArea;
      providers = await Provider.find(query)
        .populate('user', 'fullName mobileNumber')
        .sort({ rating: -1, totalJobs: -1 });
    }
    
    return res.json(providers);
  } catch (err) {
    next(err);
  }
});

// Create a booking / job request
router.post('/bookings', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const { providerId, description, scheduledTime, amount, serviceType, insuranceOpted } = req.body;

    if (!providerId || !description) {
      return res.status(400).json({ message: 'Missing provider or description' });
    }

    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    // Normalize provider reference: accept either Provider._id or User._id
    let provider = await Provider.findById(providerId).populate('user');
    if (!provider) {
      provider = await Provider.findOne({ user: providerId }).populate('user');
    }
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    let insuranceData = { opted: false };
    let finalAmount = amount || 0;

    if (insuranceOpted) {
      const insuranceCost = 49; // Fixed price for now as per requirements
      finalAmount += insuranceCost;
      insuranceData = {
        opted: true,
        cost: insuranceCost,
        policyId: `INS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        coverageDetails: 'Standard Protection: Damage, Injury, Fraud'
      };
    }

    const booking = await Booking.create({
      customer: customer._id,
      provider: provider._id,
      serviceType,
      description,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      amount: finalAmount,
      insurance: insuranceData,
    });

    // Emit Socket.IO event to notify provider
    const io = req.app.get('io');
    if (io) {
      if (provider?.user) {
        io.to(`user_${provider.user._id}`).emit('booking:new-request', {
          bookingId: booking._id,
          customerId: customer._id,
          description: booking.description,
          serviceType: booking.serviceType,
          amount: booking.amount,
          timestamp: new Date(),
        });
      }
    }

    return res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// Get bookings for current customer
router.get('/bookings', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    const bookings = await Booking.find({ customer: customer._id })
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'fullName mobileNumber' }
      })
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// Update customer current location and broadcast to provider via Socket.IO
router.post('/location', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const { lat, lng, bookingId } = req.body;
    const customer = await Customer.findOneAndUpdate(
      { user: req.user.id },
      { location: { lat, lng } },
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    // Emit Socket.IO event for real-time customer location updates
    const io = req.app.get('io');
    if (io && bookingId) {
      io.to(`booking_${bookingId}`).emit('customer:location', {
        bookingId,
        lat,
        lng,
        customerId: customer._id,
        timestamp: new Date(),
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Get simple tracking info for a booking (provider current location)
router.get('/bookings/:bookingId/tracking', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    const booking = await Booking.findOne({ _id: bookingId, customer: customer._id }).populate('provider');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Check if location sharing is allowed
    if (!booking.isLocationShared && booking.status !== 'in_progress' && booking.status !== 'completed') {
       return res.status(403).json({ message: 'Location sharing not active yet' });
    }

    return res.json({
      providerLocation: booking.provider.currentLocation,
      providerId: booking.provider._id,
      blockchainProviderId: booking.provider.blockchainProviderId,
      status: booking.status,
    });
  } catch (err) {
    next(err);
  }
});

export default router;


