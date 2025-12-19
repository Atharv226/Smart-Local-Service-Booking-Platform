import { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';

function ProviderQRCode() {
  const { profile } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [meta, setMeta] = useState(null);

  const generateQR = () => {
    const blockchainId = profile?.blockchainProviderId || '';
    if (!blockchainId) {
      setQrData(null);
      setMeta(null);
      return;
    }
    const qrId = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const payload = {
      version: '1.0',
      blockchainId,
      qrId,
      provider: {
        id: profile?._id || profile?.user?._id || '',
        name: profile?.user?.fullName || 'Provider',
        serviceType: profile?.serviceType || 'General Service',
      },
      createdAt: new Date().toISOString(),
    };
    setQrData(JSON.stringify(payload));
    setMeta({ blockchainId, qrId, name: payload.provider.name, serviceType: payload.provider.serviceType });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">QR Code Generation</h1>
        <p className="text-sm text-slate-400">
          Generate blockchain-verified QR codes for customer verification.
        </p>
      </motion.div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <motion.button
          type="button"
          onClick={generateQR}
          className="mb-6 rounded-lg bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-600 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Generate QR Code
        </motion.button>

        {qrData && (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="rounded-lg border border-primary-500/50 bg-primary-500/10 p-4">
              <QRCode value={qrData} size={256} />
            </div>
            <div className="text-sm text-slate-300 text-center">
              <p>
                <span className="font-semibold text-white">Provider:</span> {meta?.name} ({meta?.serviceType})
              </p>
              <p className="mt-1">
                <span className="font-semibold text-white">Blockchain ID:</span> <span className="font-mono text-blue-400">{meta?.blockchainId}</span>
              </p>
              <p className="mt-1">
                <span className="font-semibold text-white">QR Unique ID:</span> <span className="font-mono text-purple-400">{meta?.qrId}</span>
              </p>
              <p className="mt-2 text-slate-400">
                Blockchain-verified provider identity QR code
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ProviderQRCode;

