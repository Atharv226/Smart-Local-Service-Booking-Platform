import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function CustomerEmergency() {
  const { api } = useAuth();
  const { showToast } = useToast();
  const [emergencyProviders, setEmergencyProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [problemDesc, setProblemDesc] = useState('');

  useEffect(() => {
    loadEmergencyProviders();
  }, []);

  const loadEmergencyProviders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers/providers/search', {
        params: { serviceType: 'Emergency Services', emergency: true },
      });
      setEmergencyProviders(data || []);
    } catch {
      showToast('Failed to load emergency providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const requestEmergencyService = async () => {
    if (!selectedProvider || !problemDesc) {
      showToast('Please select a provider and describe the problem', 'error');
      return;
    }
    try {
      const { data } = await api.post('/customers/bookings', {
        providerId: selectedProvider._id,
        description: problemDesc,
        emergency: true,
      });
      showToast('Emergency service requested successfully! Provider will respond immediately.', 'success');
      setProblemDesc('');
      setSelectedProvider(null);
    } catch {
      showToast('Failed to request emergency service', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/20 to-orange-500/20 p-6"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="text-5xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
          >
            🚨
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-white">Emergency Service</h1>
            <p className="mt-2 text-sm text-slate-300">
              Get immediate access to fast emergency service providers. Available 24/7.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="rounded-xl border border-slate-700 bg-slate-800 p-6"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="mb-4 text-xl font-bold text-white">Fast Emergency Providers</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Loading emergency providers...</p>
        ) : emergencyProviders.length === 0 ? (
          <p className="text-sm text-slate-400">No emergency providers available at the moment.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {emergencyProviders.map((provider, index) => (
              <motion.div
                key={provider._id}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedProvider?._id === provider._id
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-slate-700 bg-slate-700/50 hover:border-red-500/50'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedProvider(provider)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{provider.user?.fullName || 'Provider'}</p>
                    <p className="text-sm text-slate-400">{provider.serviceType}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-yellow-400">⭐ {provider.rating || 0}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm text-slate-400">Response: Immediate</span>
                    </div>
                  </div>
                  <div className="text-3xl">🚑</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {selectedProvider && (
        <motion.div
          className="rounded-xl border border-red-500/50 bg-red-500/10 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="mb-4 text-lg font-bold text-white">
            Request Emergency Service from {selectedProvider.user?.fullName}
          </h3>
          <textarea
            rows={4}
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            placeholder="Describe your emergency situation..."
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <motion.button
            type="button"
            onClick={requestEmergencyService}
            className="mt-4 w-full rounded-lg bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🚨 Request Emergency Service Now
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

export default CustomerEmergency;

