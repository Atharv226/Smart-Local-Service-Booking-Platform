import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    age: { type: Number, required: true },
    serviceType: {
      type: String,
      enum: [
        'Home Repair & Maintenance',
        'Appliance Services',
        'Cleaning and Household',
        'Security and Safety',
        'Automobile and Transport',
        'Outdoor and Utility',
        'Smart Home and Tech',
        'Interior and Decore',
        'Personal and Local Services',
        'Emergency Services',
      ],
      required: true,
    },
    specialization: { type: String, default: '' }, // Detailed services/specialization
    identityProof: { type: String, default: '' }, // Identity proof document/reference
    serviceArea: { type: String, required: true }, // city / locality
    availableTimings: { type: String, required: true },
    experienceYears: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    blockchainProviderId: { type: String, required: true }, // simulated on-chain ID
    emergencyService: { type: Boolean, default: false }, // Accept emergency service requests
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Provider', providerSchema);


