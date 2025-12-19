import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

function ProviderLocation() {
  const { api } = useAuth();
  const { socket } = useSocket();
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);

  // Load active bookings
  useEffect(() => {
    const loadActiveBookings = async () => {
      try {
        const { data } = await api.get('/providers/jobs');
        const active = data.filter(job => job.status === 'accepted' || job.status === 'in_progress');
        setActiveBookings(active);
        
        // Join booking rooms for real-time updates
        if (socket) {
          active.forEach(booking => {
            socket.emit('join-booking', booking._id);
          });
        }
      } catch (err) {
        // ignore
      }
    };
    
    loadActiveBookings();
  }, [api, socket]);

  useEffect(() => {
    if (isSharing && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          
          // Update location on backend
          try {
            await api.post('/providers/location', location);
          } catch (err) {
            // ignore
          }
          
          // Share location via Socket.IO for all active bookings
          if (socket && activeBookings.length > 0) {
            activeBookings.forEach(booking => {
              socket.emit('provider:location-update', {
                bookingId: booking._id,
                lat: location.lat,
                lng: location.lng,
              });
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isSharing, api, socket, activeBookings]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Live Location Sharing</h1>
        <p className="text-sm text-slate-400">
          Share your real-time location with customers for service delivery.
        </p>
      </motion.div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Location Status</p>
            <p className="text-sm text-slate-400">
              {isSharing ? 'Sharing location with customers' : 'Location sharing is off'}
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => setIsSharing(!isSharing)}
            className={`rounded-lg px-6 py-3 font-bold text-white transition-all ${
              isSharing
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSharing ? 'Stop Sharing' : 'Start Sharing'}
          </motion.button>
        </div>

        {currentLocation && (
          <div className="mt-4 overflow-hidden rounded-lg">
            <iframe
              title="Current Location"
              src={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15&output=embed`}
              className="h-96 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderLocation;

