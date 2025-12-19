import mongoose from 'mongoose';

const walletTxSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    direction: { type: String, enum: ['in', 'out'], required: true },
    amount: { type: Number, required: true },
    blockchainTxHash: { type: String }, // mock hash from blockchain layer
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

export default mongoose.model('WalletTransaction', walletTxSchema);


