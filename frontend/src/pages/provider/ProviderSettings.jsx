import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

function ProviderSettings() {
  const { api } = useAuth();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    available: true,
    notifications: true,
    payoutPreference: 'wallet',
    autoShareLocation: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('providerSettings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem('providerSettings', JSON.stringify(settings));
      // Optional backend persistence:
      // await api.post('/providers/settings', settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400">
          Manage your availability, notifications, payout preferences and privacy.
        </p>
      </motion.div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Available for new jobs</p>
              <p className="text-xs text-slate-400">Show your profile as active to customers</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.available}
                onChange={(e) => setSettings((s) => ({ ...s, available: e.target.checked }))}
                className="peer sr-only"
              />
              <span className="peer h-6 w-10 rounded-full bg-slate-600 after:absolute after:h-5 after:w-5 after:rounded-full after:bg-white after:translate-x-0 peer-checked:bg-emerald-500 relative after:top-0.5 after:left-0.5 peer-checked:after:translate-x-4 transition-all"></span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Notifications</p>
              <p className="text-xs text-slate-400">Receive alerts for bookings and messages</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings((s) => ({ ...s, notifications: e.target.checked }))}
                className="peer sr-only"
              />
              <span className="peer h-6 w-10 rounded-full bg-slate-600 after:absolute after:h-5 after:w-5 after:rounded-full after:bg-white after:translate-x-0 peer-checked:bg-emerald-500 relative after:top-0.5 after:left-0.5 peer-checked:after:translate-x-4 transition-all"></span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Payout Preference</p>
              <p className="text-xs text-slate-400">Choose how you receive your earnings</p>
            </div>
            <select
              value={settings.payoutPreference}
              onChange={(e) => setSettings((s) => ({ ...s, payoutPreference: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-700 p-2 text-white"
            >
              <option value="wallet">Blockchain Wallet</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Auto share live location</p>
              <p className="text-xs text-slate-400">Share location on accepted jobs automatically</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoShareLocation}
                onChange={(e) => setSettings((s) => ({ ...s, autoShareLocation: e.target.checked }))}
                className="peer sr-only"
              />
              <span className="peer h-6 w-10 rounded-full bg-slate-600 after:absolute after:h-5 after:w-5 after:rounded-full after:bg-white after:translate-x-0 peer-checked:bg-emerald-500 relative after:top-0.5 after:left-0.5 peer-checked:after:translate-x-4 transition-all"></span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <motion.button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded-lg bg-primary-500 px-4 py-2 font-bold text-white hover:bg-primary-600 disabled:opacity-50"
            whileHover={{ scale: saving ? 1 : 1.03 }}
            whileTap={{ scale: saving ? 1 : 0.97 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default ProviderSettings;


