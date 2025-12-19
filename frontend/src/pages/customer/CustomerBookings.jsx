import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function CustomerBookings() {
  const { api } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [trackingBookingId, setTrackingBookingId] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ open: false, bookingId: null });
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Claim Modal State
  const [claimModal, setClaimModal] = useState({ open: false, bookingId: null });
  const [claimType, setClaimType] = useState('damage');
  const [claimDesc, setClaimDesc] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const customerWatchRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/customers/bookings');
      setBookings(data);
      if (data && data.length > 0) {
        showToast(`Loaded ${data.length} booking(s)`, 'success');
      }
    } catch {
      showToast('Failed to load bookings', 'error');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time updates when provider accepts/rejects + fee changes
  useEffect(() => {
    if (!socket) return;

    const onNotification = async (payload) => {
      const bookingId = payload?.bookingId || payload?._id;
      if (!bookingId) return;

      try {
        // Fetch latest booking from booking service so amount/status are correct
        const { data: booking } = await api.get(`/bookings/${bookingId}`);
        setBookings((prev) => {
          const exists = prev.some((b) => b._id === booking._id);
          if (exists) {
            return prev.map((b) => (b._id === booking._id ? booking : b));
          }
          return [booking, ...prev];
        });
      } catch {
        // Fallback to reloading all bookings
        load();
      }
    };

    socket.on('booking:notification', onNotification);
    
    // Listen for provider location updates
    const onProviderLocation = (payload) => {
      if (!trackingBookingId || payload.bookingId !== trackingBookingId) return;
      setProviderLocation({ lat: payload.lat, lng: payload.lng });
    };

    socket.on('provider:location', onProviderLocation);

    return () => {
      socket.off('booking:notification', onNotification);
      socket.off('provider:location', onProviderLocation);
    };
  }, [socket, api, trackingBookingId]);

  const handlePriceDecision = async (bookingId, accepted) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/confirm-price`, { accepted });
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? data : b))
      );
      if (accepted) {
        startCustomerLocationSharing(bookingId);
        showToast('Price accepted! Sharing location...', 'success');
      } else {
        showToast('Price rejected', 'success');
      }
    } catch (err) {
      showToast('Failed to update booking', 'error');
    }
  };

  const startCustomerLocationSharing = (bookingId) => {
    if (!navigator.geolocation) {
      return;
    }
    if (customerWatchRef.current) {
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          await api.post('/customers/location', { lat, lng, bookingId });
        } catch {}
        if (socket) {
          socket.emit('customer:location-update', { bookingId, lat, lng });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    customerWatchRef.current = id;
    if (socket) {
      socket.emit('join-booking', bookingId);
    }
  };

  useEffect(() => {
    return () => {
      if (customerWatchRef.current) {
        navigator.geolocation.clearWatch(customerWatchRef.current);
        customerWatchRef.current = null;
      }
    };
  }, []);
  const handleTrack = async (bookingId) => {
    if (trackingBookingId === bookingId) {
      // Toggle off
      setTrackingBookingId(null);
      setProviderLocation(null);
      return;
    }

    setLoadingTracking(true);
    setTrackingBookingId(bookingId);
    setProviderLocation(null);

    try {
      const { data } = await api.get(`/customers/bookings/${bookingId}/tracking`);
      if (data.providerLocation && data.providerLocation.lat) {
        setProviderLocation(data.providerLocation);
      } else {
        showToast('Provider location not yet available', 'info');
      }
      
      // Join booking room
      if (socket) {
        socket.emit('join-booking', bookingId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start tracking', 'error');
      setTrackingBookingId(null);
    } finally {
      setLoadingTracking(false);
    }
  };

  // Auto-start tracking when location is shared
  const autoStartedRef = useRef(new Set());
  useEffect(() => {
    const activeBooking = bookings.find((b) => b.isLocationShared && b.status === 'accepted');
    if (activeBooking && !autoStartedRef.current.has(activeBooking._id)) {
      if (!trackingBookingId) {
        handleTrack(activeBooking._id);
        autoStartedRef.current.add(activeBooking._id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, trackingBookingId]);

  const handleReviewSubmit = async () => {
    if (!reviewText.trim()) {
      showToast('Please enter a review', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/bookings/${reviewModal.bookingId}/review`, {
        rating,
        review: reviewText,
      });
      
      showToast('Review submitted successfully!', 'success');
      
      // Update local booking
      setBookings((prev) =>
        prev.map((b) => (b._id === reviewModal.bookingId ? data.booking : b))
      );
      
      setReviewModal({ open: false, bookingId: null });
      setReviewText('');
      setRating(5);
    } catch (err) {
      showToast('Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimDesc.trim()) {
      showToast('Please describe the issue', 'error');
      return;
    }
    setSubmittingClaim(true);
    try {
      await api.post('/claims', {
        bookingId: claimModal.bookingId,
        type: claimType,
        description: claimDesc,
      });
      showToast('Claim submitted successfully! Our team will verify it shortly.', 'success');
      setClaimModal({ open: false, bookingId: null });
      setClaimDesc('');
      setClaimType('damage');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit claim', 'error');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleDownloadPolicy = (booking) => {
    if (!booking.insurance?.opted) return;
    
    // Simulate PDF generation/download
    const policyContent = `
      SERVICE INSURANCE POLICY CERTIFICATE
      ------------------------------------
      Policy ID: ${booking.insurance.policyId}
      Date: ${new Date(booking.createdAt).toLocaleDateString()}
      
      Insured: ${booking.customer?.user?.fullName || 'Customer'}
      Provider: ${booking.provider?.user?.fullName || 'Provider'}
      Service: ${booking.serviceType}
      
      Coverage:
      - Property Damage: up to ₹50,000
      - Personal Injury: Covered
      - Fraud Protection: Covered
      
      Premium Paid: ₹${booking.insurance.cost}
      
      Blockchain Record: 0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}
      Status: ACTIVE
      ------------------------------------
      Powered by Smart Local Service Booking
    `;
    
    const blob = new Blob([policyContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Insurance_Policy_${booking.insurance.policyId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Policy certificate downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Service History</h1>
        <p className="text-sm text-slate-400">
          See the status of your recent service bookings.
        </p>
      </motion.div>
      {bookings.length === 0 ? (
        <motion.p
          className="text-sm text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No bookings yet. Use the Book Service tab to request your first service.
        </motion.p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, index) => (
            <motion.div
              key={b._id}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4 hover:border-primary-500/50 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">
                    Booking #{b._id.slice(-6)}
                    {b.insurance?.opted && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
                        🛡️ Insured
                      </span>
                    )}
                    {b.insurance?.opted && (
                      <button
                        onClick={() => handleDownloadPolicy(b)}
                        className="ml-2 text-xs text-blue-400 underline hover:text-blue-300"
                      >
                        Download Policy
                      </button>
                    )}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Provider:{' '}
                    <span className="font-medium text-white">
                      {b.provider?.user?.fullName || 'Unknown provider'}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    Status:{' '}
                    <span className={`font-medium capitalize ${
                      b.status === 'completed' ? 'text-emerald-400' :
                      b.status === 'in_progress' ? 'text-blue-400' :
                      'text-yellow-400'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </p>
                  <div className="mt-1">
                    {b.priceRange && b.priceRange.min ? (
                      <p className="text-sm font-bold text-emerald-400">
                        Price Range: ₹{b.priceRange.min} - ₹{b.priceRange.max}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Amount: <span className="font-bold text-white">₹{b.amount || 0}</span>
                        {b.insurance?.opted && (
                          <span className="block text-xs text-blue-400">
                            (Includes ₹{b.insurance.cost} insurance)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">{b.description}</p>
              
              {/* Price Confirmation */}
              {b.status === 'accepted' && b.priceRange && !b.isPriceAccepted && (
                <div className="mt-4 rounded-lg bg-slate-700/50 p-3">
                  <p className="mb-2 text-sm text-white">
                    Provider proposed a price range of ₹{b.priceRange.min} - ₹{b.priceRange.max}. Do you accept?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePriceDecision(b._id, true)}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handlePriceDecision(b._id, false)}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Provider Location Info */}
              {b.isLocationShared && (
                <div className="mt-4 rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-400 font-semibold mb-1">
                        ✓ Price Accepted & Location Shared
                      </p>
                      <p className="text-xs text-slate-400">
                        The provider has shared their location.
                      </p>
                    </div>
                    <button
                      onClick={() => handleTrack(b._id)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
                        trackingBookingId === b._id ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {trackingBookingId === b._id ? 'Close Map' : 'Track Provider'}
                    </button>
                  </div>

                  {trackingBookingId === b._id && (
                    <motion.div
                      className="mt-4 space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {/* Blockchain ID Display */}
                      <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Provider Blockchain ID</p>
                        <p className="font-mono text-xs text-emerald-400 break-all">
                          {b.provider?.blockchainProviderId || 'ID not available'}
                        </p>
                      </div>

                      {/* Map Display */}
                      <div className="rounded-lg border border-slate-700 bg-slate-900/40 overflow-hidden h-64 relative">
                        {loadingTracking ? (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                            Loading location...
                          </div>
                        ) : providerLocation && providerLocation.lat ? (
                          <iframe
                            title="Provider Location"
                            src={`https://www.google.com/maps?q=${providerLocation.lat},${providerLocation.lng}&z=15&output=embed`}
                            className="h-full w-full"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm p-4 text-center">
                            Waiting for provider to update location...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              
              {/* Review Section */}
              {b.status === 'completed' && !b.rating && (
                <div className="mt-4 flex justify-end">
                  <motion.button
                    type="button"
                    onClick={() => setReviewModal({ open: true, bookingId: b._id })}
                    className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ⭐ Rate Provider
                  </motion.button>
                </div>
              )}
              
              {b.status === 'completed' && b.rating && (
                 <div className="mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
                    <p className="text-xs font-bold text-yellow-500">Your Review</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < b.rating ? 'text-yellow-400' : 'text-slate-600'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">"{b.review}"</p>
                 </div>
              )}

              {/* Insurance Claim Link */}
              {b.insurance?.opted && ['in_progress', 'completed'].includes(b.status) && (
                 <div className="mt-2 text-right">
                    <button
                      onClick={() => setClaimModal({ open: true, bookingId: b._id })}
                      className="text-xs font-medium text-red-400 hover:text-red-300 underline flex items-center justify-end gap-1 ml-auto"
                    >
                      🛡️ Raise Insurance Claim
                    </button>
                 </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div 
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
             <h3 className="mb-4 text-xl font-bold text-white">Rate Provider</h3>
             
             <div className="mb-4 flex justify-center gap-2">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button
                   key={star}
                   type="button"
                   onClick={() => setRating(star)}
                   className={`text-3xl transition-colors ${rating >= star ? 'text-yellow-400' : 'text-slate-600'}`}
                 >
                   ★
                 </button>
               ))}
             </div>
             
             <textarea
               value={reviewText}
               onChange={(e) => setReviewText(e.target.value)}
               placeholder="Write your experience..."
               className="w-full h-32 rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 outline-none focus:border-primary-500"
             />
             
             <div className="mt-6 flex gap-3">
               <button
                 onClick={() => setReviewModal({ open: false, bookingId: null })}
                 className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600"
               >
                 Cancel
               </button>
               <button
                 onClick={handleReviewSubmit}
                 disabled={submittingReview}
                 className="flex-1 rounded-lg bg-primary-500 px-4 py-2 font-bold text-white hover:bg-primary-600 disabled:opacity-50"
               >
                 {submittingReview ? 'Submitting...' : 'Submit Review'}
               </button>
             </div>
          </motion.div>
        </div>
      )}

      {/* Claim Modal */}
      {claimModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div 
            className="w-full max-w-md rounded-xl border border-red-500/30 bg-slate-800 p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
             <h3 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
               🛡️ File Insurance Claim
             </h3>
             <p className="mb-4 text-sm text-slate-400">
               Please provide details about the incident.
             </p>
             
             <div className="space-y-4">
               <div>
                 <label className="mb-1 block text-sm font-medium text-slate-300">Issue Type</label>
                 <select
                   value={claimType}
                   onChange={(e) => setClaimType(e.target.value)}
                   className="w-full rounded-lg border border-slate-600 bg-slate-700 p-2 text-white outline-none focus:border-primary-500"
                 >
                   <option value="damage">Property Damage</option>
                   <option value="injury">Personal Injury</option>
                   <option value="fraud">Service Fraud</option>
                   <option value="delay">Major Delay</option>
                   <option value="other">Other</option>
                 </select>
               </div>
               
               <div>
                 <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
                 <textarea
                   value={claimDesc}
                   onChange={(e) => setClaimDesc(e.target.value)}
                   placeholder="Describe what happened..."
                   className="w-full h-32 rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 outline-none focus:border-primary-500"
                 />
               </div>
               
               <div className="rounded-lg bg-slate-700/50 p-3 border border-slate-600 border-dashed text-center">
                 <p className="text-sm text-slate-400">📷 Upload Evidence (Photos/Videos)</p>
                 <p className="text-xs text-slate-500 mt-1">(Mock Upload - Files will be linked)</p>
               </div>
             </div>
             
             <div className="mt-6 flex gap-3">
               <button
                 onClick={() => setClaimModal({ open: false, bookingId: null })}
                 className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600"
               >
                 Cancel
               </button>
               <button
                 onClick={handleSubmitClaim}
                 disabled={submittingClaim}
                 className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 disabled:opacity-50"
               >
                 {submittingClaim ? 'Submitting...' : 'Submit Claim'}
               </button>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default CustomerBookings;


