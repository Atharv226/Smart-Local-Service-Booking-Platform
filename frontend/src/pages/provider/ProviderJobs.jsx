import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function ProviderJobs() {
  const { api } = useAuth();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingJobId, setAcceptingJobId] = useState(null);
  const [proposedMinPrice, setProposedMinPrice] = useState('');
  const [proposedMaxPrice, setProposedMaxPrice] = useState('');
  const [qrForBooking, setQrForBooking] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [mapForBooking, setMapForBooking] = useState(null);
  const [trackingBookingId, setTrackingBookingId] = useState(null);
  const [geoWatchId, setGeoWatchId] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, status } = await api.get('/providers/jobs', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (Array.isArray(data)) {
        setJobs(data);
        showToast(`Loaded ${data.length} job(s)`, 'success');
      } else if (status === 304) {
        showToast('Jobs unchanged', 'success');
      } else {
        showToast('Unexpected response while loading jobs', 'error');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 404 ? 'Provider profile not found' : 'Failed to load jobs');
      showToast(msg, 'error');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Listen for real-time booking requests
  useEffect(() => {
    if (!socket) return;

    // Listen for new booking requests
    socket.on('booking:new-request', async (payload) => {
      showToast('New booking request received!', 'success');

      // Prefer fetching the single booking from the booking service for freshness
      const bookingId = payload?.bookingId || payload?._id;
      if (!bookingId) {
        loadJobs();
        return;
      }

      try {
        const { data: booking } = await api.get(`/bookings/${bookingId}`);
        setJobs((prev) => {
          const exists = prev.some((j) => j._id === booking._id);
          if (exists) {
            return prev.map((j) => (j._id === booking._id ? booking : j));
          }
          return [booking, ...prev];
        });
      } catch {
        // Fallback: reload all jobs
        loadJobs();
      }
    });

    // Listen for booking status changes
    socket.on('booking:status-changed', (data) => {
      setJobs((prev) =>
        prev.map((job) =>
          job._id === data.bookingId ? { ...job, status: data.status } : job
        )
      );
    });

    socket.on('customer:location', (payload) => {
      if (trackingBookingId && payload.bookingId === trackingBookingId) {
        const loc = { lat: payload.lat, lng: payload.lng };
        setCustomerLocation(loc);
        setMapForBooking({ bookingId: payload.bookingId, location: loc });
      }
    });

    return () => {
      socket.off('booking:new-request');
      socket.off('booking:status-changed');
      socket.off('customer:location');
    };
  }, [socket, api, loadJobs, showToast, trackingBookingId]);

  const handleDecision = async (bookingId, decision, priceMin = null, priceMax = null) => {
    try {
      const payload = { decision };
      if (priceMin && priceMax) {
        payload.priceMin = priceMin;
        payload.priceMax = priceMax;
      }

      const { data } = await api.post(`/providers/jobs/${bookingId}/decision`, payload);
      
      // Join booking room for real-time updates
      if (socket && bookingId) {
        socket.emit('join-booking', bookingId);
      }
      
      // Emit status update via Socket.IO
      if (socket) {
        socket.emit('booking:status-update', {
          bookingId,
          status: decision === 'accept' ? 'accepted' : 'rejected',
        });
      }
      
      showToast(`Booking ${decision}ed successfully!`, 'success');
      setAcceptingJobId(null);
      setProposedMinPrice('');
      setProposedMaxPrice('');
      
      // Auto-start sharing location if accepted
      if (decision === 'accept') {
        startSharingLocation(bookingId);
      }
      
      loadJobs();
    } catch (err) {
      showToast(`Failed to ${decision} booking`, 'error');
    }
  };

  const handleGenerateQr = async (bookingId, customerLocation) => {
    setQrLoading(true);
    try {
      // Generate blockchain-based QR via backend so it contains real provider blockchain id
      const { data } = await api.post(`/bookings/${bookingId}/generate-qr`);
      setQrForBooking({ bookingId, qrData: data.qrData });

      // Set customer location for map (for provider navigation)
      if (customerLocation) {
        setMapForBooking({ bookingId, location: customerLocation });
      }
    } catch {
      // ignore
    } finally {
      setQrLoading(false);
    }
  };

  const startSharingLocation = (bookingId) => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported', 'error');
      return;
    }
    if (geoWatchId) {
      showToast('Already sharing location', 'success');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await api.post('/providers/location', {
            lat: latitude,
            lng: longitude,
            bookingId,
          });
        } catch {}
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setGeoWatchId(id);
    setTrackingBookingId(bookingId);
    showToast('Started sharing location', 'success');
  };

  const stopSharingLocation = () => {
    if (geoWatchId) {
      navigator.geolocation.clearWatch(geoWatchId);
      setGeoWatchId(null);
      setTrackingBookingId(null);
      showToast('Stopped sharing location', 'success');
    }
  };

  // Auto-resume location sharing for active jobs
  useEffect(() => {
    if (!jobs || jobs.length === 0 || geoWatchId) return;

    // Find any accepted job that has location sharing enabled
    const activeSharingJob = jobs.find(
      (j) => j.status === 'accepted' && j.isLocationShared
    );

    if (activeSharingJob) {
      console.log('Resuming location sharing for job:', activeSharingJob._id);
      startSharingLocation(activeSharingJob._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Job Requests</h1>
          <p className="text-sm text-slate-400">
            Accept or reject incoming bookings and generate QR for arrival verification.
            {isConnected && (
              <span className="ml-2 text-emerald-400">● Real-time updates active</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <motion.div
              className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.span
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Live
            </motion.div>
          )}
          <motion.button
            type="button"
            onClick={loadJobs}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-slate-400">
          No job requests yet. You&apos;ll see customer bookings here.
        </p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <motion.div
              key={job._id}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20 text-primary-400 text-xl">
                      👤
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {job.customer?.user?.fullName || 'Customer'}
                      </p>
                      <p className="text-sm text-slate-400">
                        Booking #{job._id.slice(-6)}
                        {job.insurance?.opted && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
                            🛡️ Insured
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <p className="text-xs font-semibold text-slate-400">Location</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {job.customer?.address || 'Address not provided'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <p className="text-xs font-semibold text-slate-400">Service Type</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {job.serviceType || 'General Service'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <p className="text-xs font-semibold text-slate-400">Schedule</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {job.scheduledTime || job.scheduledAt
                          ? new Date(job.scheduledTime || job.scheduledAt).toLocaleString()
                          : 'As soon as possible'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <p className="text-xs font-semibold text-slate-400">Amount</p>
                      <p className="mt-1 text-lg font-bold text-emerald-400">
                        ₹{job.amount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-700/50 p-3">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Problem Description</p>
                    <p className="text-sm text-slate-300">{job.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    job.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    job.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                    job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  {job.status === 'pending' && (
                    <>
                      {acceptingJobId === job._id ? (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Min Price (₹)"
                              value={proposedMinPrice}
                              onChange={(e) => setProposedMinPrice(e.target.value)}
                              className="w-32 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                              autoFocus
                            />
                            <input
                              type="number"
                              placeholder="Max Price (₹)"
                              value={proposedMaxPrice}
                              onChange={(e) => setProposedMaxPrice(e.target.value)}
                              className="w-32 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              type="button"
                              onClick={() => {
                                if (!proposedMinPrice || !proposedMaxPrice) {
                                  showToast('Please enter price range', 'error');
                                  return;
                                }
                                if (Number(proposedMinPrice) > Number(proposedMaxPrice)) {
                                  showToast('Min price cannot be greater than Max price', 'error');
                                  return;
                                }
                                handleDecision(job._id, 'accept', proposedMinPrice, proposedMaxPrice);
                              }}
                              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-all flex-1"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Confirm
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => {
                                setAcceptingJobId(null);
                                setProposedMinPrice('');
                                setProposedMaxPrice('');
                              }}
                              className="rounded-lg bg-slate-600 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={() => {
                            setAcceptingJobId(job._id);
                            setProposedMinPrice('');
                            setProposedMaxPrice('');
                          }}
                          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ✓ Accept
                        </motion.button>
                      )}

                      {!acceptingJobId && (
                        <motion.button
                          type="button"
                          onClick={() => handleDecision(job._id, 'reject')}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ✕ Reject
                        </motion.button>
                      )}
                    </>
                  )}
                  {job.status === 'accepted' && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <motion.button
                        type="button"
                        onClick={() => handleGenerateQr(job._id, job.customer?.location)}
                        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {qrLoading && qrForBooking?.bookingId === job._id
                          ? 'Generating...'
                          : 'Generate QR & Map'}
                      </motion.button>
                      
                      {trackingBookingId === job._id ? (
                        <motion.button
                          type="button"
                          onClick={stopSharingLocation}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Stop Sharing Location
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={() => startSharingLocation(job._id)}
                          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Start Sharing Location
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(job.status === 'accepted' || job.status === 'in_progress') && trackingBookingId === job._id && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-700/50 p-4">
                  <p className="mb-3 text-sm font-semibold text-white">Customer Live Location</p>
                  <div className="overflow-hidden rounded-lg">
                    {customerLocation && customerLocation.lat ? (
                      <iframe
                        title="Customer Live Location"
                        src={`https://www.google.com/maps?q=${customerLocation.lat},${customerLocation.lng}&z=15&output=embed`}
                        className="h-64 w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <p className="text-sm text-slate-400">Waiting for customer location...</p>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code and Map Display */}
              <AnimatePresence>
                {qrForBooking && qrForBooking.bookingId === job._id && (
                  <motion.div
                    className="mt-4 grid gap-4 md:grid-cols-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="rounded-lg border border-slate-700 bg-slate-700/50 p-4">
                      <p className="mb-3 text-sm font-semibold text-white">
                        Blockchain QR Code
                      </p>
                      <div className="flex justify-center">
                        <QRCode value={qrForBooking.qrData} size={200} />
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        Customer will scan this to verify your blockchain-backed provider identity
                      </p>
                    </div>
                    {mapForBooking && mapForBooking.bookingId === job._id && (
                      <div className="rounded-lg border border-slate-700 bg-slate-700/50 p-4">
                        <p className="mb-3 text-sm font-semibold text-white">
                          Customer Location
                        </p>
                        <div className="overflow-hidden rounded-lg">
                          <iframe
                            title="Customer Location"
                            src={`https://www.google.com/maps?q=${mapForBooking.location?.lat},${mapForBooking.location?.lng}&z=15&output=embed`}
                            className="h-64 w-full"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Navigate to this location to provide service
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProviderJobs;
