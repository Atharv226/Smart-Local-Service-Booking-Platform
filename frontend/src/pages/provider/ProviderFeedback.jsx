import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

function ProviderFeedback() {
  const { api } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/providers/feedback');
        setFeedbacks(data || []);
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
      >
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="text-sm text-slate-400">
          View customer feedback and ratings for your services.
        </p>
      </motion.div>

      {feedbacks.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="text-lg text-slate-400">No feedback yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Customer reviews will appear here after service completion.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback, index) => (
            <motion.div
              key={feedback._id}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {feedback.customer?.user?.fullName || 'Customer'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= feedback.rating ? 'text-yellow-400' : 'text-slate-600'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-300">{feedback.comment}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProviderFeedback;

