import mongoose from 'mongoose';

// Generic user for authentication (JWT) with role-based access
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['provider', 'customer', 'admin'],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);


