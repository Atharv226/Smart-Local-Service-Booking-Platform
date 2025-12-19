import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const paymentMethods = [
  {
    id: 'upi',
    name: 'UPI Payment',
    icon: '📱',
    description: 'Google Pay, PhonePe, Paytm',
    color: 'blue',
    details: {
      upiId: '',
      bankName: '',
    },
  },
  {
    id: 'card',
    name: 'Card Payment',
    icon: '💳',
    description: 'Credit/Debit Card',
    color: 'purple',
    details: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
    },
  },
  {
    id: 'cash',
    name: 'Cash Payment',
    icon: '💵',
    description: 'Pay on service completion',
    color: 'emerald',
    details: {
      preferredAmount: '',
    },
  },
  {
    id: 'wallet',
    name: 'Blockchain Wallet',
    icon: '🔗',
    description: 'Crypto & Digital Assets',
    color: 'indigo',
    details: {
      walletAddress: '',
      network: 'Polygon',
    },
  },
];

function CustomerPaymentMethod() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeMethods, setActiveMethods] = useState(['cash']); // Cash is default

  const handleMethodClick = (method) => {
    setSelectedMethod(method);
    setFormData(method.details || {});
    setShowSetupModal(true);
  };

  const handleSave = async () => {
    if (!selectedMethod) return;
    setSaving(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Add to active methods if not already present
      if (!activeMethods.includes(selectedMethod.id)) {
        setActiveMethods([...activeMethods, selectedMethod.id]);
      }
      
      showToast(`${selectedMethod.name} setup saved successfully!`, 'success');
      setShowSetupModal(false);
      setSelectedMethod(null);
      setFormData({});
    } catch (err) {
      showToast('Failed to save payment method. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (methodId) => {
    setActiveMethods(activeMethods.filter((id) => id !== methodId));
    showToast('Payment method removed successfully!', 'success');
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-500/50 bg-blue-500/20 hover:border-blue-500 hover:bg-blue-500/30',
      purple: 'border-purple-500/50 bg-purple-500/20 hover:border-purple-500 hover:bg-purple-500/30',
      emerald: 'border-emerald-500/50 bg-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/30',
      indigo: 'border-indigo-500/50 bg-indigo-500/20 hover:border-indigo-500 hover:bg-indigo-500/30',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Payment Methods</h1>
        <p className="text-sm text-slate-400">
          Manage your payment methods for seamless transactions.
        </p>
      </motion.div>

      {/* Payment Method Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {paymentMethods.map((method, index) => {
          const isActive = activeMethods.includes(method.id);
          return (
            <motion.div
              key={method.id}
              className={`rounded-xl border-2 p-5 text-center transition-all cursor-pointer ${
                isActive
                  ? getColorClasses(method.color)
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMethodClick(method)}
            >
              <motion.div
                className="mb-3 text-4xl"
                animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                {method.icon}
              </motion.div>
              <p className="text-base font-bold text-white">{method.name}</p>
              <p className="mt-1 text-xs text-slate-400">{method.description}</p>
              {isActive && (
                <motion.div
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  ✓ Active
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Active Payment Methods List */}
      {activeMethods.length > 0 && (
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-6"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          <h2 className="mb-4 text-lg font-bold text-white">Active Payment Methods</h2>
          <div className="space-y-3">
            {paymentMethods
              .filter((method) => activeMethods.includes(method.id))
              .map((method, index) => (
                <motion.div
                  key={method.id}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-700/50 p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-600 text-2xl">
                      {method.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{method.name}</p>
                      <p className="text-xs text-slate-400">{method.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => handleMethodClick(method)}
                      className="rounded-lg bg-primary-500/20 px-3 py-1.5 text-xs font-medium text-primary-400 hover:bg-primary-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                    {method.id !== 'cash' && (
                      <motion.button
                        type="button"
                        onClick={() => handleRemove(method.id)}
                        className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Remove
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Setup Modal */}
      <AnimatePresence>
        {showSetupModal && selectedMethod && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowSetupModal(false);
              setSelectedMethod(null);
              setFormData({});
            }}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 text-2xl">
                  {selectedMethod.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedMethod.name}</h3>
                  <p className="text-xs text-slate-400">{selectedMethod.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedMethod.id === 'upi' && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={formData.upiId || ''}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="yourname@paytm"
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankName || ''}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="Bank Name"
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </>
                )}

                {selectedMethod.id === 'card' && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={formData.cardNumber || ''}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Card Holder Name
                      </label>
                      <input
                        type="text"
                        value={formData.cardHolder || ''}
                        onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                        placeholder={user?.fullName || 'Card Holder Name'}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={formData.expiryDate || ''}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">CVV</label>
                        <input
                          type="text"
                          value={formData.cvv || ''}
                          onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                          placeholder="123"
                          maxLength={3}
                          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedMethod.id === 'cash' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Preferred Cash Amount Range
                    </label>
                    <input
                      type="text"
                      value={formData.preferredAmount || ''}
                      onChange={(e) => setFormData({ ...formData, preferredAmount: e.target.value })}
                      placeholder="e.g., Up to ₹5000"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Cash payment is always available. You can set a preferred amount range.
                    </p>
                  </div>
                )}

                {selectedMethod.id === 'wallet' && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        value={formData.walletAddress || ''}
                        onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                        placeholder="0x..."
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Network
                      </label>
                      <select
                        value={formData.network || 'Polygon'}
                        onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="Polygon" className="bg-slate-700">Polygon</option>
                        <option value="Ethereum" className="bg-slate-700">Ethereum</option>
                        <option value="BSC" className="bg-slate-700">BSC</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowSetupModal(false);
                    setSelectedMethod(null);
                    setFormData({});
                  }}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 rounded-lg px-4 py-2 font-bold text-white disabled:opacity-50 ${
                    selectedMethod.color === 'blue'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : selectedMethod.color === 'purple'
                      ? 'bg-purple-500 hover:bg-purple-600'
                      : selectedMethod.color === 'emerald'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomerPaymentMethod;

