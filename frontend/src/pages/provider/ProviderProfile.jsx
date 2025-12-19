import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../context/ThemeContext';

function ProviderProfile() {
  const { api, profile, setProfile } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emergencyService, setEmergencyService] = useState(false);
  const [form, setForm] = useState({
    serviceArea: '',
    availableTimings: '',
    experienceYears: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/providers/me');
        setProfile(data);
        setForm({
          serviceArea: data?.serviceArea || '',
          availableTimings: data?.availableTimings || '',
          experienceYears: data?.experienceYears ?? '',
        });
        setEmergencyService(data?.emergencyService || false);
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [api, setProfile]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/providers/me', {
        ...form,
        experienceYears: Number(form.experienceYears || 0),
        emergencyService,
      });
      setProfile(data);
      showToast('Profile updated successfully!', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEmergencyToggle = async () => {
    const newValue = !emergencyService;
    setEmergencyService(newValue);
    try {
      const { data } = await api.put('/providers/me', {
        emergencyService: newValue,
      });
      setProfile(data);
      showToast(
        newValue
          ? 'Emergency service enabled. You will receive emergency requests.'
          : 'Emergency service disabled.',
        'success'
      );
    } catch {
      setEmergencyService(!newValue); // Revert on error
      showToast('Failed to update emergency service status', 'error');
    }
  };

  if (loading) {
    return <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading profile...</p>;
  }

  if (!profile) {
    return (
      <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
        Provider profile not found. Try signing out and registering as a provider again.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Provider Profile
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            View and update your service information.
          </p>
        </div>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-5`}>
          <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Identity
          </h2>
          <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {profile.user?.fullName || ''}
          </p>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {profile.user?.mobileNumber || ''}
          </p>
          <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Service Type:{' '}
            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.serviceType}</span>
          </p>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Blockchain Provider ID:
            <span className={`ml-2 break-all rounded px-2 py-1 text-xs font-mono ${isDark ? 'bg-slate-700 text-primary-400' : 'bg-slate-100 text-primary-600'}`}>
              {profile.blockchainProviderId}
            </span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-5 text-sm`}
        >
          <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Service Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Service Area / Job Location
              </label>
              <input
                name="serviceArea"
                value={form.serviceArea}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Available Timings
              </label>
              <input
                name="availableTimings"
                value={form.availableTimings}
                onChange={handleChange}
                placeholder="E.g. 10 AM - 6 PM"
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Experience (years)
              </label>
              <input
                name="experienceYears"
                type="number"
                value={form.experienceYears}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70 transition-all"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Emergency Service Toggle */}
      <motion.div
        className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-6`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Emergency Service</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {emergencyService
                    ? 'You are accepting emergency service requests'
                    : 'Enable to accept emergency service requests'}
                </p>
              </div>
            </div>
            <p className={`mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              When enabled, you will receive priority emergency service requests from customers
              who need immediate assistance. Emergency requests are marked with high priority.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={handleEmergencyToggle}
            className={`ml-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl transition-all border-2 ${
              emergencyService
                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                : isDark
                ? 'bg-slate-700 text-slate-400 border-slate-600'
                : 'bg-slate-200 text-slate-400 border-slate-300'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {emergencyService ? '🚨' : '⚪'}
          </motion.button>
        </div>
        <motion.div
          className="mt-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: emergencyService ? 1 : 0.5 }}
        >
          <div
            className={`flex-1 rounded-lg border-2 p-3 ${
              emergencyService
                ? 'border-red-500/50 bg-red-500/10'
                : isDark
                ? 'border-slate-700 bg-slate-700/50'
                : 'border-slate-300 bg-slate-100/50'
            }`}
          >
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</p>
            <p
              className={`mt-1 text-sm font-bold ${
                emergencyService ? 'text-red-400' : isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {emergencyService ? 'ACTIVE - Accepting Emergency Requests' : 'INACTIVE'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ProviderProfile;


