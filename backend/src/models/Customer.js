import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, default: '' },
    servicePreference: {
      type: String,
      enum: ['home', 'office', 'both'],
      default: 'home',
    },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    walletBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Customer', customerSchema);


