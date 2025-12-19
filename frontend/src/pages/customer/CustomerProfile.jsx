import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function CustomerProfile() {
  const { api, user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    address: '',
    servicePreference: 'home',
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/customers/me');
        setProfile(data);
        setFormData({
          fullName: user?.fullName || '',
          email: user?.email || data?.email || '',
          mobileNumber: user?.mobileNumber || '',
          address: data?.address || '',
          servicePreference: data?.servicePreference || 'home',
        });
      } catch {
        showToast('Failed to load profile', 'error');
      }
    };
    load();
  }, [api, user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/customers/me', {
        address: formData.address,
        servicePreference: formData.servicePreference,
        email: formData.email,
      });
      setProfile(data);
      setEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Profile & Security</h1>
          <p className="text-sm text-slate-400">
            Manage your contact details, default service address, and security settings.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={() => setEditing(!editing)}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </motion.button>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-5"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Account Information
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Full Name</label>
              {editing ? (
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              ) : (
                <p className="text-base font-semibold text-white">
                  {formData.fullName || 'Customer'}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Mobile Number</label>
              {editing ? (
                <input
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              ) : (
                <p className="text-base font-semibold text-white">{formData.mobileNumber}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Email</label>
              {editing ? (
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              ) : (
                <p className="text-base font-semibold text-white">{formData.email || 'Not set'}</p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-5"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Service Details
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Service Address</label>
              {editing ? (
                <textarea
                  name="address"
                  rows={4}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter your service address"
                />
              ) : (
                <p className="text-sm text-white">{formData.address || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">Service Preference</label>
              {editing ? (
                <select
                  name="servicePreference"
                  value={formData.servicePreference}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="home" className="bg-slate-700">Home</option>
                  <option value="office" className="bg-slate-700">Office</option>
                  <option value="both" className="bg-slate-700">Both</option>
                </select>
              ) : (
                <p className="text-sm text-white capitalize">{formData.servicePreference}</p>
              )}
            </div>
            {editing && (
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70 transition-all"
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="rounded-xl border border-slate-700 bg-slate-800 p-5"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Security Settings
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3 border border-slate-600">
            <div>
              <p className="text-sm font-medium text-white">Password</p>
              <p className="text-xs text-slate-400">Last changed 30 days ago</p>
            </div>
            <motion.button
              className="rounded-lg bg-primary-500/20 px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-500/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Change Password
            </motion.button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3 border border-slate-600">
            <div>
              <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
              <p className="text-xs text-slate-400">Add an extra layer of security</p>
            </div>
            <motion.button
              className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Enable 2FA
            </motion.button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3 border border-slate-600">
            <div>
              <p className="text-sm font-medium text-white">Blockchain Identity</p>
              <p className="text-xs text-slate-400">Your verified on-chain identity</p>
            </div>
            <span className="rounded-lg bg-primary-500/20 px-4 py-2 text-sm font-medium text-primary-400">
              Verified ✓
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CustomerProfile;
