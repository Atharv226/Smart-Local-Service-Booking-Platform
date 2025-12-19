import { useState } from 'react';
import { NavLink, Route, Routes, useNavigate, useMatch } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ProviderProfile from './ProviderProfile';
import ProviderJobs from './ProviderJobs';
import ProviderPayout from './ProviderPayout';
import ProviderOverview from './ProviderOverview';
import ProviderSettings from './ProviderSettings';
import ProviderEarning from './ProviderEarning';
import ProviderFeedback from './ProviderFeedback';
import ProviderQRCode from './ProviderQRCode';
import ProviderDigitalID from './ProviderDigitalID';
import ProviderChat from './ProviderChat';
import ProviderInsurance from './ProviderInsurance';

function SidebarLink({ to, icon, label }) {
  const match = useMatch(to);
  const isActive = match !== null;
  const { isDark } = useTheme();

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        isActive
          ? `bg-primary-500/20 text-primary-400 border-l-4 border-primary-500`
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

function ProviderDashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
            Provider
          </p>
          <p className={`mt-1 text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {user?.fullName || 'Service Provider'}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.mobileNumber}</p>
        </div>
        <nav className="space-y-1 text-sm">
          <SidebarLink to="/provider/dashboard" icon="🏠" label="Dashboard" />
          <SidebarLink to="/provider/profile" icon="👤" label="Profile" />
          <SidebarLink to="/provider/jobs" icon="📥" label="Job Requests" />
          <SidebarLink to="/provider/earning" icon="💰" label="My Earning" />
          <SidebarLink to="/provider/feedback" icon="⭐" label="Feedback" />
          <SidebarLink to="/provider/qrcode" icon="📷" label="QR Code Generation" />
          <SidebarLink to="/provider/digital-id" icon="🔐" label="Verified Digital ID" />
          <SidebarLink to="/provider/insurance" icon="🛡️" label="Insurance" />
          <SidebarLink to="/provider/settings" icon="⚙️" label="Settings" />
        </nav>
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
                  Provider
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {user?.fullName || 'Service Provider'}
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
              <SidebarLink to="/provider/dashboard" icon="🏠" label="Dashboard" />
              <SidebarLink to="/provider/profile" icon="👤" label="Profile" />
              <SidebarLink to="/provider/jobs" icon="📥" label="Job Requests" />
              <SidebarLink to="/provider/earning" icon="💰" label="My Earning" />
              <SidebarLink to="/provider/feedback" icon="⭐" label="Feedback" />
              <SidebarLink to="/provider/qrcode" icon="📷" label="QR Code Generation" />
              <SidebarLink to="/provider/digital-id" icon="🔐" label="Verified Digital ID" />
              <SidebarLink to="/provider/settings" icon="⚙️" label="Settings" />
            </nav>
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
      <main className={`relative flex-1 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
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
              Provider Dashboard
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
                {user?.fullName?.[0] || 'P'}
              </span>
              <div className="hidden text-xs md:block">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {user?.fullName || 'Provider'}
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

        {/* Chat with Customer Button - Bottom Right */}
        <motion.button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 text-2xl shadow-2xl transition-all hover:from-primary-600 hover:to-indigo-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            💬
          </motion.span>
        </motion.button>

        {/* Chat Modal */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end justify-end p-4 md:items-center md:justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
            >
              <motion.div
                className="h-[600px] w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 shadow-2xl md:h-[500px]"
                initial={{ scale: 0.9, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 100 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ProviderChat onClose={() => setChatOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ProviderDashboard() {
  return (
    <ProviderDashboardLayout>
      <Routes>
        <Route path="/" element={<ProviderOverview />} />
        <Route path="/dashboard" element={<ProviderOverview />} />
        <Route path="/profile" element={<ProviderProfile />} />
        <Route path="/jobs" element={<ProviderJobs />} />
        <Route path="/earning" element={<ProviderEarning />} />
        <Route path="/feedback" element={<ProviderFeedback />} />
        <Route path="/qrcode" element={<ProviderQRCode />} />
        <Route path="/digital-id" element={<ProviderDigitalID />} />
        <Route path="/insurance" element={<ProviderInsurance />} />
        <Route path="/settings" element={<ProviderSettings />} />
      </Routes>
    </ProviderDashboardLayout>
  );
}

export default ProviderDashboard;
