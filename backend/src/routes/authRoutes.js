import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Customer from '../models/Customer.js';
import { createProviderIdentity } from '../utils/blockchain.js';

const router = express.Router();

// Helper to generate JWT
function generateToken(user) {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Log token generation for debugging
  console.log('🔑 Generating token:', {
    userId: user._id,
    role: user.role,
    hasJWTSecret: !!process.env.JWT_SECRET,
    tokenPreview: token.substring(0, 20) + '...',
  });
  
  return token;
}

// Public: register provider
router.post('/register/provider', async (req, res, next) => {
  try {
    const {
      fullName,
      age,
      mobileNumber,
      password,
      serviceType,
      specialization,
      identityProof,
      serviceArea,
      availableTimings,
      experienceYears,
    } = req.body;

    if (!fullName || !age || !mobileNumber || !password || !serviceType || !serviceArea || !availableTimings) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ mobileNumber });
    if (existing) {
      return res.status(400).json({ message: 'Mobile already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      mobileNumber,
      passwordHash,
      role: 'provider',
    });

    // Create provider profile + mock blockchain identity
    const blockchainProviderId = createProviderIdentity(user._id.toString());

    const provider = await Provider.create({
      user: user._id,
      age,
      serviceType,
      specialization: specialization || '',
      identityProof: identityProof || '',
      serviceArea,
      availableTimings,
      experienceYears: experienceYears || 0,
      blockchainProviderId,
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
      provider,
    });
  } catch (err) {
    next(err);
  }
});

// Public: register customer
router.post('/register/customer', async (req, res, next) => {
  try {
    const { fullName, mobileNumber, password, email, servicePreference, address, lat, lng } = req.body;

    if (!fullName || !mobileNumber || !password || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ mobileNumber });
    if (existing) {
      return res.status(400).json({ message: 'Mobile already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      mobileNumber,
      passwordHash,
      role: 'customer',
    });

    const customer = await Customer.create({
      user: user._id,
      email: email || '',
      servicePreference: servicePreference || 'home',
      address,
      location: {
        lat: lat || null,
        lng: lng || null,
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
      customer,
    });
  } catch (err) {
    next(err);
  }
});

// Public: login (same endpoint, role inferred from DB)
router.post('/login', async (req, res, next) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({ message: 'Missing mobile or password' });
    }

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Load profile for convenience
    let profile = null;
    if (user.role === 'provider') {
      profile = await Provider.findOne({ user: user._id });
    } else if (user.role === 'customer') {
      profile = await Customer.findOne({ user: user._id });
    }

    return res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
      profile,
    });
  } catch (err) {
    next(err);
  }
});

export default router;


