
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await User.find();
    console.log('--- Users ---');
    users.forEach(u => {
      console.log(`UserID: ${u._id}, Role: ${u.role}, Mobile: ${u.mobileNumber}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
