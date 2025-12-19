import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

function CustomerClaims() {
  const { api } = useAuth();
  const { showToast } = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const { data } = await api.get('/claims/my-claims');
        setClaims(data);
      } catch (err) {
        showToast('Failed to load claims', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [api, showToast]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Insurance Claims</h1>
        <p className="text-sm text-slate-400">
          Track the status of your insurance claims.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
        </div>
      ) : claims.length === 0 ? (
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-slate-400">No claims found.</p>
          <p className="mt-2 text-sm text-slate-500">
            You can raise a claim from your Service History for any insured booking.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim, index) => (
            <motion.div
              key={claim._id}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      claim.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      claim.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {claim.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white capitalize">
                    {claim.type} Claim
                  </h3>
                  <p className="text-sm text-slate-400">
                    Booking #{claim.booking?._id?.slice(-6) || 'Unknown'}
                  </p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-500">Policy ID</p>
                   <p className="font-mono text-xs text-blue-400">{claim.policyId}</p>
                </div>
              </div>
              
              <div className="mt-4 rounded-lg bg-slate-700/50 p-3">
                <p className="text-sm text-slate-300">{claim.description}</p>
              </div>

              {claim.adminComments && (
                <div className="mt-3 border-l-2 border-primary-500 pl-3">
                  <p className="text-xs font-semibold text-primary-400">Admin Response</p>
                  <p className="text-sm text-slate-300">{claim.adminComments}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerClaims;
