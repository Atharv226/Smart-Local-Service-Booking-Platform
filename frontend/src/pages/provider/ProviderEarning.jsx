import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function ProviderEarning() {
  const { api } = useAuth();
  const [earnings, setEarnings] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    completed: 0,
    wallet: 0,
  });
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/providers/payout-summary');
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Mock earnings calculation
        setEarnings({
          today: data?.todayEarnings || 0,
          weekly: data?.weeklyEarnings || 0,
          monthly: data?.monthlyEarnings || 0,
          completed: data?.totalEarnings || 0,
          wallet: data?.walletBalance || 0,
        });
        setTransactions(data?.transactions || []);
      } catch {
        // ignore
      }
    };
    load();
  }, [api]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert(`Deposited ₹${depositAmount} successfully!`);
      setDepositAmount('');
      setShowDepositModal(false);
      setEarnings((prev) => ({ ...prev, wallet: prev.wallet + parseFloat(depositAmount) }));
    } catch {
      alert('Deposit failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > earnings.wallet) {
      alert('Invalid amount or insufficient balance');
      return;
    }
    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert(`Withdrawn ₹${withdrawAmount} successfully!`);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      setEarnings((prev) => ({ ...prev, wallet: prev.wallet - parseFloat(withdrawAmount) }));
    } catch {
      alert('Withdrawal failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">My Earning</h1>
        <p className="text-sm text-slate-400">
          Track your earnings and manage your wallet.
        </p>
      </motion.div>

      {/* Earnings Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-5"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          <p className="text-xs font-medium text-slate-400">Today Earning</p>
          <p className="mt-2 text-3xl font-bold text-white">₹{earnings.today}</p>
          <p className="mt-1 text-xs text-slate-400">Today&apos;s total</p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-5"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs font-medium text-slate-400">Weekly Earning</p>
          <p className="mt-2 text-3xl font-bold text-white">₹{earnings.weekly}</p>
          <p className="mt-1 text-xs text-slate-400">This week</p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-5"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-medium text-slate-400">Monthly Earning</p>
          <p className="mt-2 text-3xl font-bold text-white">₹{earnings.monthly}</p>
          <p className="mt-1 text-xs text-slate-400">This month</p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-5"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs font-medium text-slate-400">Completed Payment</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">₹{earnings.completed}</p>
          <p className="mt-1 text-xs text-slate-400">Total lifetime</p>
        </motion.div>
      </div>

      {/* Wallet Section */}
      <motion.div
        className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Wallet Balance</p>
            <p className="mt-1 text-4xl font-bold text-white">₹{earnings.wallet}</p>
            <p className="mt-2 text-xs text-slate-500">Blockchain Wallet (Polygon Network)</p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-3xl">
            🔗
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="flex-1 rounded-lg border-2 border-emerald-500/50 bg-emerald-500/20 px-4 py-3 font-semibold text-white hover:bg-emerald-500/30 transition-all"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            💰 Deposit
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 rounded-lg border-2 border-blue-500/50 bg-blue-500/20 px-4 py-3 font-semibold text-white hover:bg-blue-500/30 transition-all"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            💸 Withdraw
          </motion.button>
        </div>
      </motion.div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-xl font-bold text-white">Deposit Money</h3>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <div className="mt-4 flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleDeposit}
                  disabled={processing}
                  className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                  whileHover={{ scale: processing ? 1 : 1.02 }}
                  whileTap={{ scale: processing ? 1 : 0.98 }}
                >
                  {processing ? 'Processing...' : 'Deposit'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions */}
      <motion.div
        className="rounded-xl border border-slate-700 bg-slate-800 p-6"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-lg font-bold text-white mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-400">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdraw' ? 'Withdraw' : 'Payout'}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : '-'}₹{Math.abs(tx.amount)}
                  </p>
                  {tx.ref && <p className="text-xs font-mono text-slate-500">Ref: {tx.ref}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-xl font-bold text-white">Withdraw Money</h3>
              <p className="mb-2 text-sm text-slate-400">Available Balance: ₹{earnings.wallet}</p>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <div className="mt-4 flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={processing}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 disabled:opacity-50"
                  whileHover={{ scale: processing ? 1 : 1.02 }}
                  whileTap={{ scale: processing ? 1 : 0.98 }}
                >
                  {processing ? 'Processing...' : 'Withdraw'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProviderEarning;

