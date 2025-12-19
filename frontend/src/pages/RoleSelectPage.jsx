import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function RoleSelectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-4 py-8">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 text-center shadow-2xl md:p-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="mb-2 text-2xl font-bold text-white md:text-3xl"
          {...fadeUp}
        >
          Continue as
        </motion.h1>
        <motion.p
          className="mb-8 text-sm text-slate-400"
          {...fadeUp}
        >
          {user
            ? `Signed in as ${user.fullName || ''} (${user.mobileNumber})`
            : 'Choose whether you want to use the app as a customer or service provider.'}
        </motion.p>

        <motion.div
          className="space-y-4"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.button
            type="button"
            onClick={() => navigate('/customer')}
            className="w-full rounded-xl border-2 border-slate-700 bg-slate-800 px-6 py-4 text-base font-semibold text-slate-200 transition-all hover:border-primary-500 hover:bg-slate-800/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variants={fadeUp}
          >
            I&apos;m a Customer
          </motion.button>
          <motion.button
            type="button"
            onClick={() => navigate('/provider')}
            className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-xl transition-all hover:from-primary-700 hover:to-indigo-700 hover:shadow-2xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variants={fadeUp}
          >
            I&apos;m a Service Provider
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default RoleSelectPage;
