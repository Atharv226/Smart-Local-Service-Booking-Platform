import { useState } from 'react';
import { NavLink, Route, Routes, useNavigate, useMatch } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CustomerHome from './CustomerHome';
import CustomerBookings from './CustomerBookings';
import CustomerWallet from './CustomerWallet';
import CustomerProfile from './CustomerProfile';
import CustomerScanner from './CustomerScanner';
import CustomerOverview from './CustomerOverview';
import CustomerHistory from './CustomerHistory';
import CustomerReviews from './CustomerReviews';
import CustomerPaymentMethod from './CustomerPaymentMethod';
import CustomerEmergency from './CustomerEmergency';
import CustomerPaymentMode from './CustomerPaymentMode';
import CustomerClaims from './CustomerClaims';

function SidebarLink({ to, icon, label }) {
  const match = useMatch(to);
  const isActive = match !== null;
  const { isDark } = useTheme();

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        isActive
          ? 'bg-primary-500/20 text-primary-400 border-l-4 border-primary-500'
          : isDark
          ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${
        isActive ? 'bg-primary-500/30' : isDark ? 'bg-slate-700/50' : 'bg-slate-100'
      }`}>
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

function CustomerDashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Desktop sidebar */}
      <aside className={`hidden w-64 flex-col border-r ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-4 py-6 text-sm md:flex`}>
        <div className="mb-6">
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
            Customer
          </p>
          <p className={`mt-1 text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {user?.fullName || 'Customer'}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.mobileNumber}</p>
        </div>
        <nav className="space-y-1 text-sm">
          <SidebarLink to="/customer/dashboard" icon="📊" label="Dashboard" />
          <SidebarLink to="/customer/book" icon="🛠️" label="Book Service" />
          <SidebarLink to="/customer/wallet" icon="👛" label="Wallet" />
          <SidebarLink to="/customer/payment-mode" icon="💳" label="Payment Mode" />
          <SidebarLink to="/customer/history" icon="📜" label="Service History" />
          <SidebarLink to="/customer/profile" icon="👤" label="Profile & Security" />
          <SidebarLink to="/customer/scanner" icon="📷" label="QR Scanner" />
          <SidebarLink to="/customer/reviews" icon="⭐" label="Reviews" />
        </nav>
        
        {/* Emergency Service Button */}
        <motion.button
          type="button"
          onClick={() => navigate('/customer/emergency')}
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-3 py-2.5 text-xs font-bold text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🚨 Emergency Service
        </motion.button>
        <button
          type="button"
          onClick={handleLogout}
          className={`mt-auto rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            isDark
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Logout
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className={`fixed inset-y-0 left-0 z-40 w-64 border-r ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-4 py-6 text-sm shadow-lg md:hidden`}
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">
                  Customer
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {user?.fullName || 'Customer'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-full bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1 text-sm">
              <SidebarLink to="/customer/dashboard" icon="📊" label="Dashboard" />
              <SidebarLink to="/customer/book" icon="🛠️" label="Book Service" />
              <SidebarLink to="/customer/wallet" icon="👛" label="Wallet" />
              <SidebarLink to="/customer/payment-mode" icon="💳" label="Payment Mode" />
              <SidebarLink to="/customer/history" icon="📜" label="Service History" />
              <SidebarLink to="/customer/profile" icon="👤" label="Profile & Security" />
              <SidebarLink to="/customer/scanner" icon="📷" label="QR Scanner" />
              <SidebarLink to="/customer/reviews" icon="⭐" label="Reviews" />
            </nav>
            
            {/* Emergency Service Button */}
            <motion.button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                navigate('/customer/emergency');
              }}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-3 py-2.5 text-xs font-bold text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🚨 Emergency Service
            </motion.button>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-600"
            >
              Logout
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        {/* Top navbar */}
        <header className={`flex items-center justify-between border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} px-4 py-3 text-sm shadow-lg`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${isDark ? 'border-slate-600 bg-slate-700 text-white hover:bg-slate-600' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'} md:hidden`}
            >
              ☰
            </button>
            <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Customer Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <motion.button
              type="button"
              onClick={toggleTheme}
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${isDark ? 'border-slate-600 bg-slate-700 text-white hover:bg-slate-600' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'} transition-all`}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.span
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="text-sm"
              >
                {isDark ? '🌙' : '☀️'}
              </motion.span>
            </motion.button>
            <button
              type="button"
              className={`hidden rounded-full border ${isDark ? 'border-slate-600 bg-slate-700 text-white hover:bg-slate-600' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'} px-3 py-1 text-xs md:inline-flex transition-all`}
            >
              🔔 Notifications
            </button>
            <div className={`flex items-center gap-2 rounded-full border ${isDark ? 'border-slate-600 bg-slate-700' : 'border-slate-300 bg-white'} px-2 py-1`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                {user?.fullName?.[0] || 'C'}
              </span>
              <div className="hidden text-xs md:block">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {user?.fullName || 'Customer'}
                </p>
                <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{user?.mobileNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex rounded-full ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} px-3 py-1 text-xs font-medium md:hidden transition-all`}
            >
              Logout
            </button>
          </div>
        </header>

        <motion.div
          className="mx-auto max-w-7xl px-4 py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

function CustomerDashboard() {
  return (
    <CustomerDashboardLayout>
      <Routes>
        <Route path="/" element={<CustomerOverview />} />
        <Route path="/dashboard" element={<CustomerOverview />} />
        <Route path="/book" element={<CustomerHome />} />
        <Route path="/wallet" element={<CustomerWallet />} />
        <Route path="/payment-method" element={<CustomerPaymentMethod />} />
        <Route path="/payment-mode" element={<CustomerPaymentMode />} />
        <Route path="/claims" element={<CustomerClaims />} />
        <Route path="/emergency" element={<CustomerEmergency />} />
        <Route path="/history" element={<CustomerHistory />} />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/scanner" element={<CustomerScanner />} />
        <Route path="/reviews" element={<CustomerReviews />} />
      </Routes>
    </CustomerDashboardLayout>
  );
}

export default CustomerDashboard;


