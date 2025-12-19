import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

function ProviderInsurance() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInsured: 0,
    coverageAmount: 50000,
    claims: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/providers/insurance-stats');
        setStats({
          totalInsured: data?.insuredThisMonth || 0,
          coverageAmount: 50000,
          claims: data?.claimsCount || 0,
        });
      } catch {
        // fallback
        setStats({ totalInsured: 12, coverageAmount: 50000, claims: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🛡️ Service Insurance
        </h1>
        <p className="text-sm text-slate-400">
          Protect yourself and your customers with our comprehensive insurance coverage.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Benefit Card 1 */}
        <motion.div
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-2xl">
            🤝
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">Build Trust</h3>
          <p className="text-sm text-slate-300">
            Customers prefer providers who offer insured services. It shows you care about safety.
          </p>
        </motion.div>

        {/* Benefit Card 2 */}
        <motion.div
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
            💰
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">Coverage up to ₹50k</h3>
          <p className="text-sm text-slate-300">
            Accidental damages during service are covered. You don't have to pay from your pocket.
          </p>
        </motion.div>

        {/* Benefit Card 3 */}
        <motion.div
          className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-2xl">
            🏥
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">Personal Injury</h3>
          <p className="text-sm text-slate-300">
            Medical expenses for injuries during service execution are covered.
          </p>
        </motion.div>
      </div>

      <div className="rounded-xl bg-slate-800 p-6 border border-slate-700">
        <h2 className="text-lg font-bold text-white mb-4">Insurance Status</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 rounded-lg bg-slate-700 p-4">
             <p className="text-xs text-slate-400">Coverage Status</p>
             <p className="text-lg font-bold text-emerald-400 flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
               Active
             </p>
          </div>
          <div className="flex-1 rounded-lg bg-slate-700 p-4">
             <p className="text-xs text-slate-400">Insured Jobs (This Month)</p>
             <p className="text-lg font-bold text-white">{stats.totalInsured}</p>
          </div>
          <div className="flex-1 rounded-lg bg-slate-700 p-4">
             <p className="text-xs text-slate-400">Claims Raised</p>
             <p className="text-lg font-bold text-white">{stats.claims}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderInsurance;
