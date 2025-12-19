import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

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

function ProviderOverview() {
  const { api } = useAuth();
  const [summary, setSummary] = useState({ 
    totalEarnings: 0, 
    jobsCompleted: 0,
    todayJobs: 0,
    todayEarnings: 0,
  });
  const [incoming, setIncoming] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [payoutRes, jobsRes] = await Promise.all([
          api.get('/providers/payout-summary'),
          api.get('/providers/jobs'),
        ]);
        const jobs = jobsRes.data || [];
        const today = new Date().toDateString();
        const todayJobs = jobs.filter((j) => {
          const jobDate = new Date(j.createdAt).toDateString();
          return jobDate === today && j.status === 'completed';
        }).length;
        const todayEarnings = jobs
          .filter((j) => {
            const jobDate = new Date(j.createdAt).toDateString();
            return jobDate === today && j.status === 'completed';
          })
          .reduce((sum, j) => sum + (j.amount || 0), 0);

        setSummary({
          ...(payoutRes.data || { totalEarnings: 0, jobsCompleted: 0 }),
          todayJobs,
          todayEarnings,
        });
        setIncoming(jobs.filter((j) => j.status === 'pending').length);
      } catch {
        // ignore
      }
    };
    load();
  }, [api]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview of your jobs, earnings, and performance.
          </p>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Today Job"
          value={summary.todayJobs}
          sublabel="Jobs completed today"
          icon="📅"
          accent="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          label="Complete Job"
          value={summary.jobsCompleted || 0}
          sublabel="Total completed jobs"
          icon="✅"
          accent="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          label="Earning Today"
          value={`₹${summary.todayEarnings || 0}`}
          sublabel="Today's total earnings"
          icon="💰"
          accent="bg-yellow-500/20 text-yellow-400"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Incoming Requests"
          value={incoming}
          sublabel="New jobs waiting for your response"
          icon="📥"
          accent="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          label="Total Earnings"
          value={`₹${summary.totalEarnings || 0}`}
          sublabel="Lifetime earnings"
          icon="💵"
          accent="bg-indigo-500/20 text-indigo-400"
        />
      </div>

      <motion.div
        className="rounded-xl border border-slate-700 bg-slate-800 p-6"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="mb-4 text-lg font-bold text-white">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-700/50 p-4">
            <p className="text-sm font-semibold text-white">Check Job Requests</p>
            <p className="mt-1 text-xs text-slate-400">
              Review and respond to new customer bookings
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-700/50 p-4">
            <p className="text-sm font-semibold text-white">View Earnings</p>
            <p className="mt-1 text-xs text-slate-400">
              Track your daily, weekly, and monthly earnings
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ProviderOverview;
