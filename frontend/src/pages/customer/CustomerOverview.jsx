import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function StatCard({ label, value, sublabel, icon, accent = 'bg-primary-500/20 text-primary-400', onClick }) {
  return (
    <motion.div
      className={`rounded-xl bg-slate-800 p-5 shadow-lg border border-slate-700 cursor-pointer hover:border-primary-500/50 transition-all ${onClick ? 'hover:scale-105' : ''}`}
      variants={fadeUp}
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${accent}`}>
          {icon}
        </span>
      </div>
    </motion.div>
  );
}

function CustomerOverview() {
  const { api, user, token, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [walletTotal, setWalletTotal] = useState(0);
  const [providers, setProviders] = useState([]);
  const [serviceMode, setServiceMode] = useState('local'); // 'local' or 'company'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    // Wait for auth to load
    if (authLoading) {
      return; // Still loading, wait
    }
    
    // Check if user is authenticated
    if (!user || !token) {
      // Check localStorage as fallback (in case state hasn't updated yet)
      const stored = localStorage.getItem('auth');
      if (!stored) {
        console.log('❌ No auth found, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      // If localStorage has auth but state doesn't, wait a moment
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token && parsed.user) {
          console.log('✅ Auth found in localStorage, waiting for state update...');
          return; // Wait for state to update
        }
      } catch (err) {
        console.error('Error parsing stored auth:', err);
      }
      navigate('/login', { replace: true });
      return;
    }

    // Check if we already loaded data recently to prevent double-fetching
    if (window.customerOverviewLoaded && Date.now() - window.customerOverviewLoaded < 1000) {
      return;
    }
    window.customerOverviewLoaded = Date.now();

    const load = async () => {
      setDataLoading(true);
      try {
        // Add a small delay to ensure token is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const [bRes, wRes, pRes] = await Promise.all([
          api.get('/customers/bookings').catch(err => {
            console.error('Error loading bookings:', err);
            if (err.response?.status === 401) {
              // Don't show toast immediately - might be a timing issue
              console.warn('⚠️ 401 error loading bookings, but might be timing issue');
              // Only redirect if we're sure it's a real auth error
              const stored = localStorage.getItem('auth');
              if (!stored) {
                showToast('Session expired. Please login again.', 'error');
                navigate('/login', { replace: true });
              }
            }
            return { data: [] };
          }),
          api.get('/payouts/wallet').catch(err => {
            console.error('Error loading wallet:', err);
            if (err.response?.status === 401) {
              return { data: [] };
            }
            return { data: [] };
          }),
          api.get('/customers/providers/search', { params: { serviceArea: '' } }).catch(err => {
            console.error('Error loading providers:', err);
            if (err.response?.status === 401) {
              return { data: [] };
            }
            return { data: [] };
          }),
        ]);
        setBookings(bRes.data || []);
        const total = (wRes.data || []).reduce(
          (sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount),
          0
        );
        setWalletTotal(total);
        setProviders(pRes.data || []);
      } catch (err) {
        console.error('Error loading overview data:', err);
        if (err.response?.status === 401) {
          showToast('Authentication failed. Please login again.', 'error');
          navigate('/login', { replace: true });
        }
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [api, user, token, authLoading, navigate, showToast]);

  const activeCount = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'in_progress'
  ).length;

  const recentBookings = bookings.slice(0, 5);
  const nearbyProviders = providers.slice(0, 4);

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return null; // Will redirect to login
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, {user?.fullName || 'Customer'}! Manage your services and bookings.
          </p>
        </div>
      </motion.div>

      {/* Insurance Promo Banner */}
      <motion.div
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🛡️ New: Service Insurance
            </h2>
            <p className="mt-2 text-sm text-blue-100 max-w-lg">
              Get covered up to <span className="font-bold">₹50,000</span> for damages, accidents, and fraud. 
              Add insurance to your next booking for just ₹49.
            </p>
          </div>
          <button
            onClick={() => navigate('/customer/book')}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap"
          >
            Book with Insurance
          </button>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active Bookings"
          value={activeCount}
          sublabel="In progress or pending"
          icon="📡"
          accent="bg-blue-500/20 text-blue-400"
          onClick={() => navigate('/customer/history')}
        />
        <StatCard
          label="Wallet Balance"
          value={`₹${walletTotal}`}
          sublabel="Blockchain wallet"
          icon="👛"
          accent="bg-emerald-500/20 text-emerald-400"
          onClick={() => navigate('/customer/wallet')}
        />
        <StatCard
          label="Total Bookings"
          value={bookings.length}
          sublabel="All-time services"
          icon="📜"
          accent="bg-purple-500/20 text-purple-400"
          onClick={() => navigate('/customer/history')}
        />
        <StatCard
          label="Nearby Providers"
          value={nearbyProviders.length}
          sublabel="Available now"
          icon="📍"
          accent="bg-orange-500/20 text-orange-400"
          onClick={() => navigate('/customer/book')}
        />
      </div>

      {/* Local Service & Company Service Blocks */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Local Service Block */}
        <motion.div
          className="rounded-xl bg-slate-800 p-6 shadow-lg border border-slate-700"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🏠</span> Local Service
            </h2>
            <button
              onClick={() => {
                setServiceMode('local');
                navigate('/customer/book');
              }}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
            >
              View All
            </button>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Find verified local service providers in your area. All providers are blockchain-verified
            and rated by customers.
          </p>
          <div className="space-y-3">
            {nearbyProviders.slice(0, 3).map((provider) => (
              <div
                key={provider._id}
                className="rounded-lg bg-slate-700/50 p-3 border border-slate-600 hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{provider.user?.fullName || 'Provider'}</p>
                    <p className="text-xs text-slate-400">{provider.serviceType}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-yellow-400">⭐ {provider.rating || 0}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{provider.serviceArea}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/customer/book')}
                    className="rounded-lg bg-primary-500/20 px-3 py-1 text-xs font-medium text-primary-400 hover:bg-primary-500/30"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Company Service Block */}
        <motion.div
          className="rounded-xl bg-slate-800 p-6 shadow-lg border border-slate-700"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🏢</span> Company Service
            </h2>
            <button
              onClick={() => {
                setServiceMode('company');
                navigate('/customer/book');
              }}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-all"
            >
              Search
            </button>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Search and book services from verified companies. Professional teams with guaranteed
            service quality.
          </p>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company name..."
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="rounded-lg bg-slate-700/50 p-4 border border-slate-600">
            <p className="text-sm text-slate-400">
              Search for companies like &quot;UrbanPlumb Services&quot;, &quot;TechFix Solutions&quot;,
              or &quot;HomeCare Experts&quot;
            </p>
          </div>
        </motion.div>
      </div>

      {/* Book Service Section */}
      <motion.div
        className="rounded-xl bg-gradient-to-r from-primary-500/20 to-indigo-500/20 p-6 shadow-lg border border-primary-500/30"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🛠️</span> Book Service
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Describe your problem and get matched with the best service providers instantly.
            </p>
          </div>
          <button
            onClick={() => navigate('/customer/book')}
            className="rounded-lg bg-primary-500 px-6 py-3 text-base font-bold text-white hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl"
          >
            Book Now →
          </button>
        </div>
      </motion.div>

      {/* Nearby Provider Section */}
      <motion.div
        className="rounded-xl bg-slate-800 p-6 shadow-lg border border-slate-700"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📍</span> Nearby Providers
          </h2>
          <button
            onClick={() => navigate('/customer/book')}
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            View All →
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {nearbyProviders.map((provider) => (
            <div
              key={provider._id}
              className="rounded-lg bg-slate-700/50 p-4 border border-slate-600 hover:border-primary-500/50 transition-all"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                  👤
                </div>
                <span className="text-xs font-medium text-yellow-400">
                  ⭐ {provider.rating || 0}
                </span>
              </div>
              <p className="font-semibold text-white">{provider.user?.fullName || 'Provider'}</p>
              <p className="mt-1 text-xs text-slate-400">{provider.serviceType}</p>
              <p className="mt-1 text-xs text-slate-500">{provider.serviceArea}</p>
              <button
                onClick={() => navigate('/customer/book')}
                className="mt-3 w-full rounded-lg bg-primary-500/20 px-3 py-1.5 text-xs font-medium text-primary-400 hover:bg-primary-500/30"
              >
                Request Service
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Service History Section */}
      <motion.div
        className="rounded-xl bg-slate-800 p-6 shadow-lg border border-slate-700"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📜</span> Service History
          </h2>
          <button
            onClick={() => navigate('/customer/history')}
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            View All →
          </button>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-sm text-slate-400">No service history yet. Book your first service!</p>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between rounded-lg bg-slate-700/50 p-4 border border-slate-600"
              >
                <div>
                  <p className="font-semibold text-white">
                    Booking #{booking._id.slice(-6)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{booking.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      Provider: {booking.provider?.user?.fullName || 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span
                      className={`text-xs font-medium ${
                        booking.status === 'completed'
                          ? 'text-emerald-400'
                          : booking.status === 'in_progress'
                          ? 'text-blue-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">₹{booking.amount || 0}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Emergency Help Section */}
      <motion.div
        className="rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 p-6 shadow-lg border border-red-500/30"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🚨</span> Emergency Help
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Need immediate assistance? Get connected with emergency service providers instantly.
            </p>
          </div>
          <button
            onClick={() => navigate('/customer/book')}
            className="rounded-lg bg-red-500 px-6 py-3 text-base font-bold text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-xl"
          >
            Emergency →
          </button>
        </div>
      </motion.div>

      {/* Profile & Security Section */}
      <motion.div
        className="rounded-xl bg-slate-800 p-6 shadow-lg border border-slate-700"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">👤</span> Profile & Security
          </h2>
          <button
            onClick={() => navigate('/customer/profile')}
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            Edit →
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-slate-700/50 p-4 border border-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Account</p>
            <p className="mt-2 text-base font-semibold text-white">{user?.fullName || 'Customer'}</p>
            <p className="mt-1 text-sm text-slate-400">{user?.mobileNumber}</p>
            <p className="mt-1 text-sm text-slate-400">{user?.email || 'No email'}</p>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-4 border border-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Security</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Password</span>
                <button className="text-xs font-medium text-primary-400 hover:text-primary-300">
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">2FA</span>
                <span className="text-xs font-medium text-emerald-400">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Blockchain ID</span>
                <span className="text-xs font-medium text-primary-400">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Provider Rating Section */}
      <motion.div
        className="rounded-xl bg-slate-800 p-6 shadow-lg border border-slate-700"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">⭐</span> Provider Ratings
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {recentBookings
            .filter((b) => b.status === 'completed' && b.provider)
            .slice(0, 3)
            .map((booking) => (
              <div
                key={booking._id}
                className="rounded-lg bg-slate-700/50 p-4 border border-slate-600"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-white">
                    {booking.provider?.user?.fullName || 'Provider'}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= (booking.provider?.rating || 0)
                            ? 'text-yellow-400'
                            : 'text-slate-600'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400">{booking.provider?.serviceType}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Completed on {new Date(booking.updatedAt).toLocaleDateString()}
                </p>
                <button className="mt-3 w-full rounded-lg bg-primary-500/20 px-3 py-1.5 text-xs font-medium text-primary-400 hover:bg-primary-500/30">
                  Rate Provider
                </button>
              </div>
            ))}
          {recentBookings.filter((b) => b.status === 'completed').length === 0 && (
            <p className="col-span-3 text-sm text-slate-400">
              No completed bookings yet. Complete a service to rate providers.
            </p>
          )}
        </div>
      </motion.div>

      {/* Payment Options Section */}
      <motion.div
        className="rounded-xl bg-slate-800 p-6 shadow-lg border border-slate-700"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">💳</span> Payment Options
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Choose your preferred payment method for seamless transactions.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {/* UPI Payment */}
          <div
            className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
              selectedPayment === 'upi'
                ? 'border-primary-500 bg-primary-500/20'
                : 'border-slate-600 bg-slate-700/50 hover:border-primary-500/50'
            }`}
            onClick={() => setSelectedPayment('upi')}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 text-xl">
                📱
              </div>
              <div>
                <p className="font-semibold text-white">UPI Payment</p>
                <p className="text-xs text-slate-400">Google Pay, PhonePe, Paytm</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Instant payment using UPI apps. Fast and secure.
            </p>
          </div>

          {/* Blockchain Wallet */}
          <div
            className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
              selectedPayment === 'wallet'
                ? 'border-primary-500 bg-primary-500/20'
                : 'border-slate-600 bg-slate-700/50 hover:border-primary-500/50'
            }`}
            onClick={() => setSelectedPayment('wallet')}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 text-xl">
                🔗
              </div>
              <div>
                <p className="font-semibold text-white">Blockchain Wallet</p>
                <p className="text-xs text-slate-400">Crypto & Digital Assets</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Pay using blockchain wallet. Decentralized and secure.
            </p>
            <p className="mt-2 text-xs font-medium text-purple-400">
              Balance: ₹{walletTotal}
            </p>
          </div>

          {/* Cash Payment */}
          <div
            className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
              selectedPayment === 'cash'
                ? 'border-primary-500 bg-primary-500/20'
                : 'border-slate-600 bg-slate-700/50 hover:border-primary-500/50'
            }`}
            onClick={() => setSelectedPayment('cash')}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xl">
                💵
              </div>
              <div>
                <p className="font-semibold text-white">Cash Payment</p>
                <p className="text-xs text-slate-400">Pay on service completion</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Traditional cash payment. Pay directly to the provider.
            </p>
          </div>
        </div>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg bg-primary-500/10 border border-primary-500/30 p-4"
          >
            <p className="text-sm font-medium text-primary-400">
              Selected: {selectedPayment === 'upi' ? 'UPI Payment' : selectedPayment === 'wallet' ? 'Blockchain Wallet' : 'Cash Payment'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              This payment method will be used for your next booking.
            </p>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
}

export default CustomerOverview;
