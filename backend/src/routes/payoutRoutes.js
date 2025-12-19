import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Provider from '../models/Provider.js';
import Booking from '../models/Booking.js';
import { recordWalletTransactionOnChain } from '../utils/blockchain.js';

const router = express.Router();

// Get wallet transactions for current user
router.get('/wallet', authRequired, async (req, res, next) => {
  try {
    const txs = await WalletTransaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(txs);
  } catch (err) {
    next(err);
  }
});

// Record blockchain-based payout for a booking
router.post('/wallet/booking/:bookingId/pay', authRequired, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { amount, method } = req.body; // method: offline | online | blockchain

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // For demo, allow customer or provider to trigger payment; real app would have stricter rules

    booking.paymentMethod = method || 'offline';
    booking.amount = amount || booking.amount || 0;
    booking.paymentStatus = 'paid';
    await booking.save();

    let txRecord = null;
    if (method === 'blockchain') {
      const provider = await Provider.findById(booking.provider);
      const chainResult = recordWalletTransactionOnChain({
        userId: provider.user,
        bookingId: booking._id.toString(),
        amount: booking.amount,
        direction: 'in',
      });

      txRecord = await WalletTransaction.create({
        user: provider.user,
        booking: booking._id,
        direction: 'in',
        amount: booking.amount,
        blockchainTxHash: chainResult.txHash,
        status: 'confirmed',
      });
    }

    return res.json({
      booking,
      walletTransaction: txRecord,
    });
  } catch (err) {
    next(err);
  }
});

// Deposit money into wallet (Simulation)
router.post('/wallet/deposit', authRequired, async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const tx = await WalletTransaction.create({
      user: req.user.id,
      direction: 'in',
      amount,
      status: 'confirmed',
      description: 'Deposit via Bank Transfer',
    });

    return res.json(tx);
  } catch (err) {
    next(err);
  }
});

// Withdraw money from wallet (Simulation)
router.post('/wallet/withdraw', authRequired, async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // Check balance
    const txs = await WalletTransaction.find({ user: req.user.id });
    const balance = txs.reduce((sum, t) => sum + (t.direction === 'in' ? t.amount : -t.amount), 0);
    
    if (balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const tx = await WalletTransaction.create({
      user: req.user.id,
      direction: 'out',
      amount,
      status: 'confirmed',
      description: 'Withdrawal to Bank Account',
    });

    return res.json(tx);
  } catch (err) {
    next(err);
  }
});

// Request Payout (Simulation)
router.post('/wallet/payout', authRequired, async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // Check balance
    const txs = await WalletTransaction.find({ user: req.user.id });
    const balance = txs.reduce((sum, t) => sum + (t.direction === 'in' ? t.amount : -t.amount), 0);
    
    if (balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const tx = await WalletTransaction.create({
      user: req.user.id,
      direction: 'out',
      amount,
      status: 'confirmed',
      description: 'Payout Request Processed',
    });

    return res.json(tx);
  } catch (err) {
    next(err);
  }
});

export default router;


