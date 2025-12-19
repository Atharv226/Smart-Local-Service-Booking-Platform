import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';
import { Html5Qrcode } from 'html5-qrcode';

function CustomerScanner() {
  const { api } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setResult(null);
      
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
          html5QrCode.stop().catch(() => {});
          setScanning(false);
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );
      showToast('Camera started. Point at QR code to scan.', 'success');
    } catch (err) {
      showToast('Failed to start camera. Please check permissions.', 'error');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
    }
    setScanning(false);
    showToast('Camera stopped', 'success');
  };

  const handleScanSuccess = async (qrData) => {
    setLoading(true);
    try {
      let parsed = null;
      try {
        parsed = JSON.parse(qrData);
      } catch {
        parsed = null;
      }

      // If QR contains bookingId => verify booking/provider combo.
      // Otherwise treat it as provider digital-id QR.
      const isBookingQr = !!parsed?.bookingId;
      const endpoint = isBookingQr ? '/bookings/verify-qr' : '/providers/verify-qr';

      const { data } = await api.post(endpoint, { qrData });

      setProviderLocation(data.providerLocation || null);
      setResult({
        success: !!data.verified,
        type: isBookingQr ? 'booking' : 'provider',
        bookingId: data.bookingId || null,
        provider: data.provider || null,
      });

      showToast('Provider verified successfully!', 'success');

      // For booking QR, join booking room so we can receive live provider location.
      if (isBookingQr && socket && data.bookingId) {
        socket.emit('join-booking', data.bookingId);
      }
    } catch (err) {
      setResult({
        success: false,
        error: err.response?.data?.message || 'Verification failed',
      });
      setProviderLocation(null);
      showToast('Verification failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Live provider location updates (only for booking-based QR verification)
  useEffect(() => {
    if (!socket) return;

    const onProviderLocation = (payload) => {
      if (!payload) return;
      if (result?.type !== 'booking') return;
      if (result?.bookingId && payload.bookingId && payload.bookingId !== result.bookingId) return;
      setProviderLocation({ lat: payload.lat, lng: payload.lng });
    };

    socket.on('provider:location', onProviderLocation);
    return () => {
      socket.off('provider:location', onProviderLocation);
    };
  }, [socket, result]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">QR Scanner</h1>
        <p className="text-sm text-slate-400">
          Scan the provider&apos;s QR code to verify their blockchain-backed identity.
        </p>
      </motion.div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        {loading && (
          <p className="mb-4 text-sm text-slate-400">Verifying QR...</p>
        )}
        {!scanning ? (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="mb-6 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-700 text-5xl">
                📷
              </div>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Click the button below to start scanning QR codes
            </p>
            <motion.button
              type="button"
              onClick={startScanning}
              className="rounded-lg bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Camera Scanner
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div id="qr-reader" className="mb-4 rounded-lg overflow-hidden bg-slate-900"></div>
            <motion.button
              type="button"
              onClick={stopScanning}
              className="w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Stop Scanning
            </motion.button>
          </motion.div>
        )}

        {result && (
          <motion.div
            className="mt-4 rounded-lg border p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {result.success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
                  <p className="font-semibold text-emerald-400">
                    ✓ Provider verified successfully
                    {result.bookingId ? ` for booking #${result.bookingId?.slice(-6)}` : ''}
                  </p>
                  {result.provider?.blockchainProviderId && (
                    <p className="mt-2 text-xs text-slate-300">
                      Blockchain ID: <span className="font-mono">{result.provider.blockchainProviderId}</span>
                    </p>
                  )}
                </div>

                {result.provider && (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                    <p className="mb-3 text-sm font-semibold text-white">Provider Details</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Name</p>
                        <p className="text-sm text-white">{result.provider.user?.fullName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Mobile</p>
                        <p className="text-sm text-white">{result.provider.user?.mobileNumber || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Service Type</p>
                        <p className="text-sm text-white">{result.provider.serviceType || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Service Area</p>
                        <p className="text-sm text-white">{result.provider.serviceArea || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Experience</p>
                        <p className="text-sm text-white">{(result.provider.experienceYears ?? '—').toString()} year(s)</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Available Timings</p>
                        <p className="text-sm text-white">{result.provider.availableTimings || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Specialization</p>
                        <p className="text-sm text-white">{result.provider.specialization || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Rating</p>
                        <p className="text-sm text-white">{(result.provider.rating ?? '—').toString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                  <p className="mb-3 text-sm font-semibold text-white">Provider Location</p>
                  {providerLocation?.lat != null && providerLocation?.lng != null ? (
                    <div className="overflow-hidden rounded-lg">
                      <iframe
                        title="Provider Location"
                        src={`https://www.google.com/maps?q=${providerLocation.lat},${providerLocation.lng}&z=15&output=embed`}
                        className="h-80 w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Location not available yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                <p className="font-semibold text-red-400">
                  ✕ {result.error || 'Verification failed'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default CustomerScanner;
