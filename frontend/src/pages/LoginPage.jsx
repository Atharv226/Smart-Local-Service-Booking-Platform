import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function LoginPage() {
  const { login, api } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobileNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      
      // Verify response has required data
      if (!data.token || !data.user) {
        throw new Error('Invalid login response: missing token or user data');
      }
      
      console.log('✅ Login successful:', {
        userId: data.user.id,
        role: data.user.role,
        hasToken: !!data.token,
        tokenLength: data.token.length,
        hasProfile: !!data.profile,
      });
      
      // Prepare auth data - backend returns 'profile', but we need role-specific key
      const authData = {
        token: data.token,
        user: data.user,
        profile: data.profile || null,
      };
      
      // Store auth data
      login(authData);
      
      // Verify token was stored
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token === data.token) {
          console.log('✅ Token stored successfully in localStorage');
        } else {
          console.error('❌ Token mismatch after storage');
        }
      }
      
      // Wait a moment for state to update, then navigate
      setTimeout(() => {
        if (data.user.role === 'provider') {
          console.log('🔄 Navigating to provider dashboard...');
          navigate('/provider/dashboard', { replace: true });
        } else if (data.user.role === 'customer') {
          console.log('🔄 Navigating to customer dashboard...');
          navigate('/customer/dashboard', { replace: true });
        } else {
          navigate('/role-select', { replace: true });
        }
      }, 150);
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-4 py-8">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl md:p-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="mb-2 text-center text-2xl font-bold text-white md:text-3xl"
          {...fadeUp}
        >
          Welcome back
        </motion.h1>
        <motion.p
          className="mb-6 text-center text-sm text-slate-400"
          {...fadeUp}
        >
          Sign in with your mobile number to manage bookings.
        </motion.p>

        {error && (
          <motion.div
            className="mb-4 rounded-xl bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div {...fadeUp}>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Mobile Number
            </label>
            <input
              name="mobileNumber"
              type="tel"
              required
              value={form.mobileNumber}
              onChange={handleChange}
              placeholder="Enter your mobile number"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </motion.div>
          <motion.div {...fadeUp}>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-3 text-base font-bold text-white shadow-xl transition-all hover:from-primary-700 hover:to-indigo-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            {...fadeUp}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-xl"
                >
                  ⏳
                </motion.span>
                Signing in...
              </span>
            ) : (
              'Login'
            )}
          </motion.button>
        </form>

        <motion.p
          className="mt-6 text-center text-sm text-slate-400"
          {...fadeUp}
        >
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary-400 hover:text-primary-300 transition-colors"
          >
            Sign up
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
