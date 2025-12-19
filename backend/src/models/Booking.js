import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    serviceType: { type: String }, // Service type for this booking
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledTime: { type: Date },
    priceRange: {
      min: { type: Number },
      max: { type: Number },
    },
    isPriceAccepted: { type: Boolean, default: false },
    isLocationShared: { type: Boolean, default: false },
    insurance: {
      opted: { type: Boolean, default: false },
      cost: { type: Number, default: 0 },
      policyId: { type: String },
      coverageDetails: { type: String },
    },
    providerLocationSnapshots: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    verificationQrData: { type: String }, // payload that customer scans
    verifiedAt: { type: Date },
    paymentMethod: {
      type: String,
      enum: ['offline', 'online', 'blockchain'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    amount: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);


