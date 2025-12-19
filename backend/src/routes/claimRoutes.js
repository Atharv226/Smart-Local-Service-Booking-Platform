import express from 'express';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import InsuranceClaim from '../models/InsuranceClaim.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new claim
router.post('/', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const { bookingId, type, description, evidenceImages } = req.body;

    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    const booking = await Booking.findOne({ _id: bookingId, customer: customer._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!booking.insurance?.opted) {
      return res.status(400).json({ message: 'This booking is not insured.' });
    }

    // Check if claim already exists for this booking
    const existingClaim = await InsuranceClaim.findOne({ booking: booking._id });
    if (existingClaim) {
      return res.status(400).json({ message: 'A claim has already been raised for this booking.' });
    }

    const claim = await InsuranceClaim.create({
      booking: booking._id,
      customer: customer._id,
      policyId: booking.insurance.policyId,
      type,
      description,
      evidenceImages: evidenceImages || [],
    });

    return res.status(201).json(claim);
  } catch (err) {
    next(err);
  }
});

// Get claims for current customer
router.get('/my-claims', authRequired, requireRole('customer'), async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id });
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    const claims = await InsuranceClaim.find({ customer: customer._id })
      .populate('booking')
      .sort({ createdAt: -1 });

    return res.json(claims);
  } catch (err) {
    next(err);
  }
});

export default router;
