import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';

const serviceTypes = [
  'Home Repair & Maintenance',
  'Appliance Services',
  'Cleaning and Household',
  'Security and Safety',
  'Automobile and Transport',
  'Outdoor and Utility',
  'Smart Home and Tech',
  'Interior and Decore',
  'Personal and Local Services',
  'Emergency Services',
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function CustomerHome() {
  const { api, user, profile } = useAuth();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [serviceType, setServiceType] = useState('Home Repair & Maintenance');
  const [serviceArea, setServiceArea] = useState('');
  const [mode, setMode] = useState('local'); // 'local' or 'company'
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingDesc, setBookingDesc] = useState('');
  const [customerLocation, setCustomerLocation] = useState(null);
  const [insuranceOpted, setInsuranceOpted] = useState(false);

  const searchProviders = async () => {
    setLoading(true);
    try {
      // Use customer's location/address for better matching
      const searchArea = serviceArea || (profile?.address ? profile.address.split(',')[0] : '');
      
      const params =
        mode === 'local'
          ? { serviceType, serviceArea: searchArea || query }
          : { serviceType, companyName: query || searchArea };

      const { data } = await api.get('/customers/providers/search', { params });
      
      setProviders(data);
      if (data && data.length > 0) {
        showToast(`Found ${data.length} ${mode === 'local' ? 'local providers' : 'companies'}`, 'success');
      } else {
        showToast('No providers found in your area. Try different search criteria.', 'error');
      }
    } catch {
      showToast('Failed to search providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get customer location and load providers automatically
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        // Get customer profile to get address/location
        const { data: customerData } = await api.get('/customers/me');
        if (customerData?.address) {
          setServiceArea(customerData.address.split(',')[0] || customerData.address);
        }
        if (customerData?.location?.lat && customerData?.location?.lng) {
          setCustomerLocation(customerData.location);
        }
        
        // Auto-search providers based on customer location
        if (customerData?.address || customerData?.location) {
          await searchProviders();
        }
      } catch (err) {
        // If customer profile not found, still try to search
        searchProviders();
      }
    };
    
    loadCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createBooking = async () => {
    if (!selectedProvider || !bookingDesc) {
      showToast('Please select a provider and describe the problem', 'error');
      return;
    }
    try {
      const { data } = await api.post('/customers/bookings', {
        providerId: selectedProvider._id,
        description: bookingDesc,
        serviceType: selectedProvider.serviceType,
        amount: 0, // Can be calculated based on service
        insuranceOpted,
      });
      
      // Join booking room for real-time updates
      if (socket && data._id) {
        socket.emit('join-booking', data._id);
      }
      
      showToast(`Booking created successfully! Provider will be notified in real-time.`, 'success');
      setBookingDesc('');
      setSelectedProvider(null);
      
      // Listen for booking status updates
      if (socket) {
        socket.on('booking:status-changed', (updateData) => {
          if (updateData.bookingId === data._id) {
            showToast(`Booking ${updateData.status}!`, 'success');
          }
        });
      }
    } catch (err) {
      showToast('Failed to create booking', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-lg font-semibold text-white md:text-xl">
            {mode === 'local' ? 'Find Local Service Providers' : 'Find Company Service Providers'}
          </h1>
          <p className="mt-1 text-sm text-slate-400 md:text-base">
            Describe your problem and we&apos;ll show matching{' '}
            {mode === 'local' ? 'nearby independent providers' : 'verified service companies'}.
            You can send a request and track their arrival.
          </p>
        </div>
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
            Real-time Active
          </motion.div>
        )}
      </motion.div>

      <div className="w-full">
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-lg"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          {/* Toggle between local / company services */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-full bg-slate-700 p-1 text-[0.8rem] font-medium">
              <motion.button
                type="button"
                onClick={() => setMode('local')}
                className={`rounded-full px-3 py-1 transition ${
                  mode === 'local'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Local Services
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setMode('company')}
                className={`rounded-full px-3 py-1 transition ${
                  mode === 'company'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Company Services
              </motion.button>
            </div>
            <p className="text-[0.75rem] text-slate-400">
              Toggle to switch between local professionals and registered companies.
            </p>
          </div>

          <motion.div
            className="mb-3 flex flex-col gap-2 md:flex-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'local'
                  ? "Briefly describe your problem (e.g. 'Leaking kitchen tap')"
                  : "Type company name or service brand (e.g. 'UrbanPlumb Services')"
              }
              className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-base text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              whileFocus={{ scale: 1.02 }}
            />
            <motion.select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-base text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              whileFocus={{ scale: 1.02 }}
            >
              {serviceTypes.map((type) => (
                <option key={type} value={type} className="bg-slate-700">
                  {type}
                </option>
              ))}
            </motion.select>
            <motion.input
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder={mode === 'local' ? 'Area / locality' : 'City / region'}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-base text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              whileFocus={{ scale: 1.02 }}
            />
            <motion.button
              type="button"
              onClick={searchProviders}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.span>
              ) : (
                'Search'
              )}
            </motion.button>
          </motion.div>

          {providers.length === 0 ? (
            <motion.p
              className="text-sm text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No {mode === 'local' ? 'local providers' : 'company providers'} found yet. Try
              changing the area, company name, or service type.
            </motion.p>
          ) : (
            <div className="space-y-2">
              {providers.map((p, index) => (
                <motion.div
                  key={p._id}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-slate-600 bg-slate-700/50 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500/50 hover:bg-slate-700 hover:shadow-md md:flex-row md:items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div>
                    <p className="text-base font-semibold text-white">
                      {p.user?.fullName ||
                        (mode === 'local' ? 'Local Provider' : 'Service Company')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.serviceType} · {p.serviceArea}
                    </p>
                    <p className="text-xs text-slate-400">
                      Rating:{' '}
                      <span className="font-medium text-yellow-400">{p.rating || 0}</span> (
                      {p.totalJobs || 0} jobs)
                    </p>
                    <p className="text-xs text-slate-400">
                      Availability: {p.availableTimings}
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setSelectedProvider(p)}
                    className="self-start rounded-full bg-primary-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Request Service
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4 text-sm"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <p className="mb-2 text-sm font-semibold text-white">
              Send request to {selectedProvider.user?.fullName || 'provider'}
            </p>
            <textarea
              rows={2}
              value={bookingDesc}
              onChange={(e) => setBookingDesc(e.target.value)}
              placeholder="Describe exactly what needs to be fixed or installed..."
              className="w-full rounded-lg border border-primary-500/30 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />

            {/* Insurance Option */}
            <div className="mt-3 mb-1 rounded-lg bg-blue-500/10 p-2 border border-blue-500/30">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={insuranceOpted}
                  onChange={(e) => setInsuranceOpted(e.target.checked)}
                  className="w-5 h-5 rounded border-blue-500 text-blue-500 focus:ring-blue-500 bg-slate-700"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white flex items-center gap-1">
                      🛡️ Add Service Insurance
                    </p>
                    <span className="text-sm font-bold text-emerald-400">₹49</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Covers damages (₹50k), personal injury & service fraud.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <motion.button
                type="button"
                onClick={() => {
                  setSelectedProvider(null);
                  setBookingDesc('');
                  setInsuranceOpted(false);
                }}
                className="rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={createBooking}
                className="rounded-full bg-primary-500 px-4 py-1 text-xs font-medium text-white hover:bg-primary-600 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Send Request
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomerHome;


