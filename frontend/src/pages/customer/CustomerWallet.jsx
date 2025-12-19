import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function CustomerWallet() {
  const { api } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [txs, setTxs] = useState([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadTxs = useCallback(async () => {
    try {
      const { data } = await api.get('/payouts/wallet');
      setTxs(data);
    } catch {
      // ignore
    }
  }, [api]);

  useEffect(() => {
    loadTxs();
  }, [loadTxs]);

  useEffect(() => {
    if (!socket) return;
    const onWalletUpdate = () => {
      loadTxs();
      showToast('Wallet balance updated', 'info');
    };
    socket.on('wallet:updated', onWalletUpdate);
    return () => {
      socket.off('wallet:updated', onWalletUpdate);
    };
  }, [socket, loadTxs, showToast]);

  const total = txs.reduce(
    (sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount),
    0
  );

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    setProcessing(true);
    try {
      await api.post('/payouts/wallet/deposit', { amount: parseFloat(depositAmount) });
      showToast(`Deposited ₹${depositAmount} successfully!`, 'success');
      setDepositAmount('');
      setShowDepositModal(false);
      loadTxs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Deposit failed. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    setProcessing(true);
    try {
      await api.post('/payouts/wallet/withdraw', { amount: parseFloat(withdrawAmount) });
      showToast(`Withdrawn ₹${withdrawAmount} successfully!`, 'success');
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      loadTxs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Withdrawal failed. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    setProcessing(true);
    try {
      await api.post('/payouts/wallet/payout', { amount: parseFloat(payoutAmount) });
      showToast(`Payout of ₹${payoutAmount} processed successfully!`, 'success');
      setPayoutAmount('');
      setShowPayoutModal(false);
      loadTxs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Payout failed. Please try again.', 'error');
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
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-sm text-slate-400">
          Manage your blockchain wallet, deposits, withdrawals, and payouts.
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Total Balance</p>
            <motion.p
              className="mt-1 text-4xl font-bold text-white"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              ₹{total}
            </motion.p>
            <p className="mt-2 text-xs text-slate-500">Blockchain Wallet (Polygon Network)</p>
          </div>
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🔗
          </motion.div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <motion.button
          type="button"
          onClick={() => setShowDepositModal(true)}
          className="rounded-xl border-2 border-emerald-500/50 bg-emerald-500/20 p-4 text-center transition-all hover:border-emerald-500 hover:bg-emerald-500/30"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="mb-2 text-3xl">💰</div>
          <p className="text-base font-bold text-white">Deposit Money</p>
          <p className="mt-1 text-xs text-slate-400">Add funds to your wallet</p>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setShowWithdrawModal(true)}
          className="rounded-xl border-2 border-blue-500/50 bg-blue-500/20 p-4 text-center transition-all hover:border-blue-500 hover:bg-blue-500/30"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="mb-2 text-3xl">💸</div>
          <p className="text-base font-bold text-white">Withdraw</p>
          <p className="mt-1 text-xs text-slate-400">Transfer to bank account</p>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setShowPayoutModal(true)}
          className="rounded-xl border-2 border-purple-500/50 bg-purple-500/20 p-4 text-center transition-all hover:border-purple-500 hover:bg-purple-500/30"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="mb-2 text-3xl">💳</div>
          <p className="text-base font-bold text-white">Payout</p>
          <p className="mt-1 text-xs text-slate-400">Request payment for services</p>
        </motion.button>
      </motion.div>

      {/* Transactions */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="mb-4 text-lg font-bold text-white">Transaction History</h2>
        {txs.length === 0 ? (
          <p className="text-sm text-slate-400">
            No wallet transactions yet. Deposit money to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {txs.map((tx, index) => (
              <motion.div
                key={tx._id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-4 hover:border-primary-500/50 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Direction:{' '}
                      <span className={`font-medium ${
                        tx.direction === 'in' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {tx.direction === 'in' ? 'Received' : 'Sent'}
                      </span>
                    </p>
                    <motion.p
                      className="text-lg font-bold text-white mt-1"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      {tx.direction === 'in' ? '+' : '-'}₹{tx.amount}
                    </motion.p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Status: <span className={`font-medium ${
                        tx.status === 'confirmed' ? 'text-emerald-400' : 'text-yellow-400'
                      }`}>{tx.status}</span>
                    </p>
                  </div>
                </div>
                {tx.blockchainTxHash && (
                  <p className="mt-2 break-all text-xs text-slate-500 font-mono">
                    Tx Hash: {tx.blockchainTxHash}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {processing ? 'Processing...' : 'Deposit'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="mb-2 text-sm text-slate-400">Available Balance: ₹{total}</p>
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {processing ? 'Processing...' : 'Withdraw'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPayoutModal(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-xl font-bold text-white">Request Payout</h3>
              <p className="mb-2 text-sm text-slate-400">Available Balance: ₹{total}</p>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <div className="mt-4 flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handlePayout}
                  disabled={processing}
                  className="flex-1 rounded-lg bg-purple-500 px-4 py-2 font-bold text-white hover:bg-purple-600 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {processing ? 'Processing...' : 'Request Payout'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomerWallet;
