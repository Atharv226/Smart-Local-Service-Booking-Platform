# Socket.IO Real-Time Communication Setup

## ✅ Socket.IO Integration Complete

Your application now has real-time communication capabilities using Socket.IO!

### Features Implemented:

1. **Real-Time Location Tracking**
   - Providers can share live location updates
   - Customers receive real-time location updates for active bookings

2. **Live Chat**
   - Real-time messaging between customers and providers
   - Messages are broadcast to all participants in a booking room

3. **Booking Status Updates**
   - Real-time notifications when booking status changes
   - Instant updates when provider accepts/rejects bookings

4. **Emergency Service Requests**
   - Customers can send emergency service requests
   - All providers with emergency service enabled receive instant notifications

5. **Booking Notifications**
   - Providers receive instant notifications for new booking requests
   - Customers receive notifications when providers respond

### Socket.IO Events:

#### Client → Server Events:

- `authenticate` - Authenticate user with Socket.IO
- `join-booking` - Join a booking room for real-time updates
- `leave-booking` - Leave a booking room
- `provider:location-update` - Provider sends location update
- `chat:message` - Send a chat message
- `booking:status-update` - Update booking status
- `emergency:request` - Send emergency service request
- `emergency:accept` - Provider accepts emergency request

#### Server → Client Events:

- `authenticated` - Confirmation of successful authentication
- `provider:location` - Real-time provider location update
- `chat:message` - Receive chat message
- `booking:status-changed` - Booking status changed notification
- `booking:new-request` - New booking request notification
- `booking:notification` - General booking notification
- `emergency:new-request` - New emergency service request
- `emergency:accepted` - Emergency request accepted

### How to Use:

#### In Frontend Components:

```javascript
import { useSocket } from '../context/SocketContext';

function MyComponent() {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for events
    socket.on('booking:new-request', (data) => {
      console.log('New booking request:', data);
    });

    // Emit events
    socket.emit('join-booking', bookingId);

    // Cleanup
    return () => {
      socket.off('booking:new-request');
    };
  }, [socket]);
}
```

#### In Backend Routes:

```javascript
// Access Socket.IO instance
const io = req.app.get('io');

// Emit to specific room
io.to(`booking_${bookingId}`).emit('booking:status-changed', {
  bookingId,
  status: 'accepted',
});

// Emit to specific user
io.to(`user_${userId}`).emit('booking:notification', {
  message: 'Your booking was accepted',
});
```

### Connection Status:

- **Backend**: Socket.IO server running on `http://localhost:5000`
- **Frontend**: Socket.IO client connects automatically when user is authenticated
- **CORS**: Configured to allow connections from frontend

### Testing:

1. Start the backend server: `npm start` or `npm run dev`
2. Start the frontend: `npm run dev`
3. Open browser console to see Socket.IO connection logs
4. Test real-time features:
   - Create a booking (customer)
   - Accept booking (provider)
   - Send location updates
   - Send chat messages

### Troubleshooting:

1. **Connection Issues:**
   - Check that backend server is running
   - Verify CORS settings in `server.js`
   - Check browser console for connection errors

2. **Events Not Working:**
   - Ensure user is authenticated
   - Check that Socket.IO context is properly set up
   - Verify event names match between client and server

3. **Room Joining:**
   - Make sure to join booking rooms before listening to events
   - Use `join-booking` event with booking ID

---

**Status**: ✅ Socket.IO fully integrated and ready to use!

