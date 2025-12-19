import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const paymentTypes = [
  {
    id: 'upi',
    name: 'UPI Payment',
    icon: '📱',
    description: 'Google Pay, PhonePe, Paytm',
    color: 'blue',
  },
  {
    id: 'card',
    name: 'Card Payment',
    icon: '💳',
    description: 'Credit/Debit Card',
    color: 'purple',
  },
  {
    id: 'cash',
    name: 'Cash Payment',
    icon: '💵',
    description: 'Pay on service completion',
    color: 'emerald',
  },
  {
    id: 'wallet',
    name: 'Wallet (Blockchain Based)',
    icon: '🔗',
    description: 'Crypto & Digital Assets',
    color: 'indigo',
  },
];

function CustomerPaymentMode() {
  const { showToast } = useToast();
  const { user, api } = useAuth();
  const [selectedMode, setSelectedMode] = useState('upi');
  const [loading, setLoading] = useState(false);

  // Form States
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: '',
  });
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedMode = localStorage.getItem('payment_mode');
    if (savedMode) setSelectedMode(savedMode);

    const savedUpi = localStorage.getItem('payment_upi');
    if (savedUpi) setUpiId(savedUpi);

    const savedCard = localStorage.getItem('payment_card');
    if (savedCard) {
      try {
        setCardDetails(JSON.parse(savedCard));
      } catch { /* ignore */ }
    }

    // Load wallet balance if wallet is selected
    if (selectedMode === 'wallet') {
      // Mock or fetch real balance
      // For now we can fetch from a mock endpoint or just user context if updated
       const loadBalance = async () => {
         try {
           // In a real app, this would be a dedicated balance endpoint
           // For now, let's assume we can get it from /payouts/wallet transaction sum or similar
           // Or just mock it for the UI demo as requested "turn on wallet section"
           const { data } = await api.get('/payouts/wallet');
           const total = data.reduce(
            (sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount),
            0
           );
           setWalletBalance(total);
         } catch {
           setWalletBalance(0);
         }
       };
       loadBalance();
    }
  }, [selectedMode, api]);

  const handleSave = () => {
    setLoading(true);
    // Save to localStorage
    localStorage.setItem('payment_mode', selectedMode);
    if (selectedMode === 'upi') localStorage.setItem('payment_upi', upiId);
    if (selectedMode === 'card') localStorage.setItem('payment_card', JSON.stringify(cardDetails));

    setTimeout(() => {
      showToast(`${paymentTypes.find((m) => m.id === selectedMode)?.name} details saved!`, 'success');
      setLoading(false);
    }, 1000);
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      blue: isSelected ? 'border-blue-500 bg-blue-500/30' : 'border-blue-500/50 bg-blue-500/20 hover:border-blue-500 hover:bg-blue-500/30',
      purple: isSelected ? 'border-purple-500 bg-purple-500/30' : 'border-purple-500/50 bg-purple-500/20 hover:border-purple-500 hover:bg-purple-500/30',
      emerald: isSelected ? 'border-emerald-500 bg-emerald-500/30' : 'border-emerald-500/50 bg-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/30',
      indigo: isSelected ? 'border-indigo-500 bg-indigo-500/30' : 'border-indigo-500/50 bg-indigo-500/20 hover:border-indigo-500 hover:bg-indigo-500/30',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Payment Mode</h1>
        <p className="text-sm text-slate-400">
          Select and configure your preferred payment method.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {paymentTypes.map((mode, index) => (
          <motion.div
            key={mode.id}
            className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${getColorClasses(mode.color, selectedMode === mode.id)}`}
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedMode(mode.id)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-4xl">
                {mode.icon}
              </div>
              {selectedMode === mode.id && (
                <motion.div
                  className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  Selected
                </motion.div>
              )}
            </div>
            <p className="text-xl font-bold text-white">{mode.name}</p>
            <p className="mt-2 text-sm text-slate-300">{mode.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="rounded-xl border border-slate-700 bg-slate-800 p-6"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="mb-6 text-lg font-bold text-white">
          Configure {paymentTypes.find((m) => m.id === selectedMode)?.name}
        </h2>

        {selectedMode === 'upi' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">
                UPI ID / VPA
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. username@okhdfc"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter your Google Pay, PhonePe, or Paytm UPI ID.
              </p>
            </div>
          </div>
        )}

        {selectedMode === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">
                Card Number
              </label>
              <input
                type="text"
                maxLength="16"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                placeholder="0000 0000 0000 0000"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength="5"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  CVV
                </label>
                <input
                  type="password"
                  maxLength="3"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">
                Card Holder Name
              </label>
              <input
                type="text"
                placeholder="JOHN DOE"
                value={cardDetails.holder}
                onChange={(e) => setCardDetails({ ...cardDetails, holder: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        )}

        {selectedMode === 'wallet' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-indigo-500/50 bg-indigo-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-400">Current Balance</p>
                  <p className="text-3xl font-bold text-white">₹{walletBalance}</p>
                </div>
                <div className="text-3xl">🔗</div>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Payments will be deducted automatically from your blockchain wallet.
              Ensure you have sufficient funds before booking.
            </p>
          </div>
        )}

        {selectedMode === 'cash' && (
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💵</div>
              <div>
                <p className="font-bold text-emerald-400">Cash on Delivery Enabled</p>
                <p className="text-sm text-emerald-200/70">
                  You can pay cash directly to the provider after the service is completed.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-primary-500 px-6 py-2 font-bold text-white hover:bg-primary-600 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Saving...' : 'Save Details'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default CustomerPaymentMode;
