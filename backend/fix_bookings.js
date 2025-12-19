
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/Booking.js';
import Provider from './src/models/Provider.js';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    const bookings = await Booking.find();
    console.log(`Checking ${bookings.length} bookings...`);

    let fixedCount = 0;

    for (const booking of bookings) {
      // Try to find the provider as is
      const providerExists = await Provider.findById(booking.provider);
      
      if (providerExists) {
        // Correctly linked
        continue;
      }

      console.log(`⚠️ Booking ${booking._id} has invalid provider ID: ${booking.provider}`);

      // Check if it's a User ID
      const user = await User.findById(booking.provider);
      if (user && user.role === 'provider') {
        // Find the actual Provider document for this user
        const realProvider = await Provider.findOne({ user: user._id });
        if (realProvider) {
          console.log(`   Found matching provider ${realProvider._id} for user ${user._id}. Updating...`);
          booking.provider = realProvider._id;
          await booking.save();
          fixedCount++;
        } else {
          console.log(`   ❌ User found but no Provider profile exists.`);
        }
      } else {
        console.log(`   ❌ ID is not a provider User ID either.`);
      }
    }

    console.log(`Migration complete. Fixed ${fixedCount} bookings.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
