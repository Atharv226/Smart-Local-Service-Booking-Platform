import 'dotenv/config'; // Load environment variables FIRST
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import claimRoutes from './routes/claimRoutes.js';

// Verify critical environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not found in .env, using default (not secure for production)');
} else {
  console.log('✅ JWT_SECRET loaded from .env:', process.env.JWT_SECRET.substring(0, 10) + '...');
}
if (!process.env.MONGO_URI) {
  console.warn('⚠️  MONGO_URI not found in .env');
}

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Local Service Booking API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/claims', claimRoutes);

// Global error handler (simple)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Server error',
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_booking';

// Socket.IO connection handling
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User authentication via socket
  socket.on('authenticate', (data) => {
    const { userId, role } = data;
    if (userId) {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.role = role;
      socket.join(`user_${userId}`);
      socket.join(`role_${role}`);
      console.log(`✅ User authenticated via socket: ${userId} (${role})`);
      
      // Notify user of successful connection
      socket.emit('authenticated', { success: true, userId, role });
    }
  });

  // Live location sharing (Provider)
  socket.on('provider:location-update', (data) => {
    const { bookingId, lat, lng } = data;
    // Broadcast to customer who has this booking
    socket.to(`booking_${bookingId}`).emit('provider:location', { bookingId, lat, lng });
  });

  // Live location sharing (Customer)
  socket.on('customer:location-update', (data) => {
    const { bookingId, lat, lng } = data;
    // Broadcast to provider who has this booking
    socket.to(`booking_${bookingId}`).emit('customer:location', { bookingId, lat, lng });
  });

  // Join booking room for real-time updates
  socket.on('join-booking', (bookingId) => {
    socket.join(`booking_${bookingId}`);
    console.log(`📦 Socket ${socket.id} joined booking room: ${bookingId}`);
  });

  // Leave booking room
  socket.on('leave-booking', (bookingId) => {
    socket.leave(`booking_${bookingId}`);
    console.log(`📦 Socket ${socket.id} left booking room: ${bookingId}`);
  });

  // Real-time chat messages
  socket.on('chat:message', (data) => {
    const { bookingId, message, senderId, senderName, senderRole } = data;
    // Broadcast to all sockets in the booking room
    io.to(`booking_${bookingId}`).emit('chat:message', {
      bookingId,
      message,
      senderId,
      senderName,
      senderRole,
      timestamp: new Date(),
    });
  });

  // Booking status updates
  socket.on('booking:status-update', (data) => {
    const { bookingId, status } = data;
    io.to(`booking_${bookingId}`).emit('booking:status-changed', { bookingId, status });
  });

  // Emergency service request (Customer -> Providers)
  socket.on('emergency:request', (data) => {
    const { customerId, location, serviceType, description } = data;
    // Broadcast to all providers who have emergency service enabled
    io.to('role_provider').emit('emergency:new-request', {
      customerId,
      location,
      serviceType,
      description,
      timestamp: new Date(),
    });
  });

  // Provider accepts emergency request
  socket.on('emergency:accept', (data) => {
    const { requestId, providerId } = data;
    // Notify the customer
    io.to(`user_${data.customerId}`).emit('emergency:accepted', {
      requestId,
      providerId,
      timestamp: new Date(),
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`🔌 Socket disconnected: ${socket.id} (User: ${socket.userId})`);
    } else {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    }
  });
});

// Make io available to routes
app.set('io', io);

// MongoDB connection with better error handling
mongoose
  .connect(MONGO_URI, {
    // MongoDB Atlas connection options
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  })
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log(`🔌 Socket.IO server ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('💡 Please check your MongoDB Atlas connection string in .env file');
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

