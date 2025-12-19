
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Provider from './src/models/Provider.js';
import User from './src/models/User.js';
import Booking from './src/models/Booking.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    const providers = await Provider.find().populate('user');
    console.log('--- Providers ---');
    providers.forEach(p => {
      console.log(`ProviderID: ${p._id}, UserID: ${p.user._id}, Name: ${p.user.fullName}, Mobile: ${p.user.mobileNumber}`);
    });

    const bookings = await Booking.find();
    console.log('\n--- Bookings ---');
    bookings.forEach(b => {
      console.log(`BookingID: ${b._id}, ProviderField: ${b.provider}, Customer: ${b.customer}, Status: ${b.status}`);
    });

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
