import mongoose from 'mongoose';

const insuranceClaimSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    policyId: { type: String, required: true },
    type: {
      type: String,
      enum: ['damage', 'injury', 'delay', 'fraud', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    evidenceImages: [String], // URLs
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'approved', 'rejected'],
      default: 'pending',
    },
    adminComments: { type: String },
    refundAmount: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model('InsuranceClaim', insuranceClaimSchema);
