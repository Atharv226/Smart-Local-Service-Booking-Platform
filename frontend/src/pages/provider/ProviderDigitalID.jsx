import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

function ProviderDigitalID() {
  const { profile } = useAuth();
  const [digitalId, setDigitalId] = useState(null);

  useEffect(() => {
    if (profile?.blockchainProviderId) {
      setDigitalId({
        id: profile.blockchainProviderId,
        network: 'Polygon',
        verified: true,
        createdAt: profile.createdAt,
      });
    }
  }, [profile]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Verified Digital ID</h1>
        <p className="text-sm text-slate-400">
          Your blockchain-based verified provider identity.
        </p>
      </motion.div>

      {digitalId ? (
        <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Blockchain Provider ID</p>
              <p className="mt-2 text-2xl font-bold text-white font-mono">
                {digitalId.id}
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-2xl">
              ✓
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-700/50 p-4">
              <p className="text-xs font-semibold text-slate-400">Network</p>
              <p className="mt-1 text-sm font-medium text-white">{digitalId.network}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-700/50 p-4">
              <p className="text-xs font-semibold text-slate-400">Status</p>
              <p className="mt-1 text-sm font-medium text-emerald-400">Verified</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="rounded-lg border border-primary-500/50 bg-primary-500/10 p-4">
              <QRCode value={digitalId.id} size={200} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="text-lg text-slate-400">Digital ID not available</p>
        </div>
      )}
    </div>
  );
}

export default ProviderDigitalID;

