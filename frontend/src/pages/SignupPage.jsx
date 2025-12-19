import { useState } from 'react';
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

function SignupPage() {
  const { login, api } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerStep, setProviderStep] = useState(1); // 1: Personal Info, 2: Verification & Services

  const [providerForm, setProviderForm] = useState({
    fullName: '',
    age: '',
    mobileNumber: '',
    password: '',
    serviceType: 'Home Repair & Maintenance',
    specialization: '',
    identityProof: '',
    serviceArea: '',
    availableTimings: '',
    experienceYears: '',
  });

  const [customerForm, setCustomerForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    serviceType: 'Home',
    address: '',
  });

  const handleProviderChange = (e) => {
    setProviderForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCustomerChange = (e) => {
    setCustomerForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProviderNext = (e) => {
    e.preventDefault();
    // Validate personal info fields
    if (!providerForm.fullName || !providerForm.age || !providerForm.mobileNumber || !providerForm.password) {
      setError('Please fill all required fields');
      return;
    }
    setError('');
    setProviderStep(2);
  };

  const handleProviderBack = () => {
    setProviderStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'provider') {
        // Validate verification & services fields
        if (!providerForm.identityProof || !providerForm.serviceType) {
          setError('Please fill all required fields');
          setLoading(false);
          return;
        }
        // Validate all required fields
        if (!providerForm.serviceArea || !providerForm.availableTimings) {
          setError('Please fill all required fields (Service Area and Available Timings are required)');
          setLoading(false);
          return;
        }
        
        const payload = {
          ...providerForm,
          age: Number(providerForm.age),
          experienceYears: Number(providerForm.experienceYears || 0),
        };
        
        console.log('📝 Registering provider with payload:', { ...payload, password: '***' });
        
        const { data } = await api.post('/auth/register/provider', payload);
        
        if (!data.token || !data.user) {
          throw new Error('Invalid registration response: missing token or user data');
        }
        
        console.log('✅ Provider registration successful:', {
          userId: data.user.id,
          role: data.user.role,
          hasToken: !!data.token,
        });
        
        // Store auth data first
        login({ token: data.token, user: data.user, profile: data.provider });
        
        // Verify token was stored
        const stored = localStorage.getItem('auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token === data.token) {
            console.log('✅ Token stored successfully in localStorage');
          }
        }
        
        // Wait a moment for state to update, then navigate
        setTimeout(() => {
          navigate('/provider/dashboard', { replace: true });
        }, 100);
      } else {
        // Validate customer fields
        if (!customerForm.fullName || !customerForm.mobileNumber || !customerForm.password || !customerForm.address) {
          setError('Please fill all required fields (Full Name, Mobile Number, Password, Address)');
          setLoading(false);
          return;
        }
        
        console.log('📝 Registering customer with payload:', { ...customerForm, password: '***' });
        
        // Convert serviceType to servicePreference (Home -> home, Office -> office, Both -> both)
        const servicePreferenceMap = {
          'Home': 'home',
          'Office': 'office',
          'Both': 'both',
        };
        
        const payload = {
          fullName: customerForm.fullName,
          mobileNumber: customerForm.mobileNumber,
          password: customerForm.password,
          email: customerForm.email || '',
          address: customerForm.address,
          servicePreference: servicePreferenceMap[customerForm.serviceType] || 'home',
        };
        
        const { data } = await api.post('/auth/register/customer', payload);
        
        if (!data.token || !data.user) {
          throw new Error('Invalid registration response: missing token or user data');
        }
        
        console.log('✅ Customer registration successful:', {
          userId: data.user.id,
          role: data.user.role,
          hasToken: !!data.token,
        });
        
        // Store auth data first
        login({ token: data.token, user: data.user, profile: data.customer });
        
        // Verify token was stored
        const stored = localStorage.getItem('auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token === data.token) {
            console.log('✅ Token stored successfully in localStorage');
          }
        }
        
        // Wait a moment for state to update, then navigate
        setTimeout(() => {
          navigate('/customer/dashboard', { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Sign up failed. Please check all fields and try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const serviceTypes = [
    'Home Repair & Maintenance',
    'Appliance Services',
    'Cleaning and Household',
    'Security and Safety',
    'Automobile and Transport',
    'Outdoor and Utility',
    'Smart Home and Tech',
    'Interior and Decore',
    'Personal and Local Services',
    'Emergency Services',
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-4 py-8">
      <motion.div
        className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl md:p-10 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="mb-2 text-center text-2xl font-bold text-white md:text-3xl"
          {...fadeUp}
        >
          Create your account
        </motion.h1>
        <motion.p
          className="mb-6 text-center text-sm text-slate-400"
          {...fadeUp}
        >
          Choose whether you are booking services as a customer or offering services as a provider.
        </motion.p>

        <motion.div
          className="mb-6 flex justify-center gap-3"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.button
            type="button"
            onClick={() => setRole('customer')}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              role === 'customer'
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg scale-105'
                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={fadeUp}
          >
            I&apos;m a Customer
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setRole('provider')}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              role === 'provider'
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg scale-105'
                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={fadeUp}
          >
            I&apos;m a Service Provider
          </motion.button>
        </motion.div>

        {error && (
          <motion.div
            className="mb-4 rounded-xl bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={role === 'provider' && providerStep === 1 ? handleProviderNext : handleSubmit} className="space-y-4">
          {role === 'provider' ? (
            <>
              {/* Step 1: Personal Information */}
              {providerStep === 1 && (
                <motion.div
                  className="grid gap-4 md:grid-cols-2"
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                  key="step1"
                >
                  <motion.div className="md:col-span-2" variants={fadeUp}>
                    <div className="mb-6 mt-2 rounded-xl border-2 border-primary-500/30 bg-primary-500/10 p-4">
                      <div className="mb-4 flex items-center justify-center gap-3">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-primary-400 to-primary-400"></div>
                        <p className="text-lg font-extrabold uppercase tracking-wider text-white shadow-lg">
                          👤 Personal Information
                        </p>
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-primary-400 via-primary-400 to-transparent"></div>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <label className="mb-3 block text-lg font-extrabold text-white drop-shadow-lg">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="fullName"
                      required
                      value={providerForm.fullName}
                      onChange={handleProviderChange}
                      className="w-full rounded-xl border-3 border-primary-500/50 bg-slate-700 px-5 py-4 text-lg font-medium text-white placeholder-slate-300 shadow-lg outline-none transition-all focus:border-primary-400 focus:bg-slate-600 focus:ring-4 focus:ring-primary-500/50"
                      placeholder="Enter your full name"
                    />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <label className="mb-3 block text-lg font-extrabold text-white drop-shadow-lg">
                      Age <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="age"
                      type="number"
                      required
                      value={providerForm.age}
                      onChange={handleProviderChange}
                      className="w-full rounded-xl border-3 border-primary-500/50 bg-slate-700 px-5 py-4 text-lg font-medium text-white placeholder-slate-300 shadow-lg outline-none transition-all focus:border-primary-400 focus:bg-slate-600 focus:ring-4 focus:ring-primary-500/50"
                      placeholder="Your age"
                    />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <label className="mb-3 block text-lg font-extrabold text-white drop-shadow-lg">
                      Mobile Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="mobileNumber"
                      type="tel"
                      required
                      value={providerForm.mobileNumber}
                      onChange={handleProviderChange}
                      className="w-full rounded-xl border-3 border-primary-500/50 bg-slate-700 px-5 py-4 text-lg font-medium text-white placeholder-slate-300 shadow-lg outline-none transition-all focus:border-primary-400 focus:bg-slate-600 focus:ring-4 focus:ring-primary-500/50"
                      placeholder="+91 9876543210"
                    />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <label className="mb-3 block text-lg font-extrabold text-white drop-shadow-lg">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="password"
                      type="password"
                      required
                      value={providerForm.password}
                      onChange={handleProviderChange}
                      className="w-full rounded-xl border-3 border-primary-500/50 bg-slate-700 px-5 py-4 text-lg font-medium text-white placeholder-slate-300 shadow-lg outline-none transition-all focus:border-primary-400 focus:bg-slate-600 focus:ring-4 focus:ring-primary-500/50"
                      placeholder="Create a strong password"
                    />
                  </motion.div>
                </motion.div>
              )}

              {/* Step 2: Verification & Services + Location & Availability */}
              {providerStep === 2 && (
                <motion.div
                  className="space-y-6"
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                  key="step2"
                >
                  <motion.div className="md:col-span-2" variants={fadeUp}>
                    <div className="mb-8 mt-2 rounded-2xl border-4 border-primary-400/60 bg-gradient-to-br from-primary-500/20 to-indigo-500/20 p-8 shadow-2xl backdrop-blur-sm">
                      <div className="mb-8 flex items-center justify-center gap-3">
                        <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary-300 to-primary-300"></div>
                        <p className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-2xl">
                          ⚡ Verification & Services
                        </p>
                        <div className="h-1 flex-1 bg-gradient-to-r from-primary-300 via-primary-300 to-transparent"></div>
                      </div>
                      
                      <div className="space-y-8">
                        {/* Identity Proof */}
                        <motion.div variants={fadeUp}>
                          <label className="mb-4 block text-xl font-black text-white drop-shadow-xl">
                            🆔 Identity Proof <span className="text-red-400">*</span>
                          </label>
                          <input
                            name="identityProof"
                            required
                            value={providerForm.identityProof}
                            onChange={handleProviderChange}
                            className="w-full rounded-2xl border-4 border-primary-400/70 bg-slate-600 px-6 py-5 text-xl font-semibold text-white placeholder-slate-200 shadow-2xl outline-none transition-all focus:border-primary-300 focus:bg-slate-500 focus:ring-4 focus:ring-primary-400/70"
                            placeholder="Aadhar Number / PAN / License Number"
                          />
                          <p className="mt-3 text-lg font-bold text-slate-100">
                            ✓ Provide a valid identity proof for verification
                          </p>
                        </motion.div>

                        {/* Service Type Selection */}
                        <motion.div variants={fadeUp}>
                          <label className="mb-5 block text-xl font-black text-white drop-shadow-xl">
                            🛠️ Select Your Service Type <span className="text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {serviceTypes.map((type) => (
                              <motion.button
                                key={type}
                                type="button"
                                onClick={() =>
                                  setProviderForm((prev) => ({ ...prev, serviceType: type }))
                                }
                                className={`rounded-xl border-4 px-5 py-4 text-lg font-bold transition-all ${
                                  providerForm.serviceType === type
                                    ? 'border-primary-400 bg-primary-500 text-white shadow-2xl scale-105'
                                    : 'border-slate-600 bg-slate-700 text-slate-200 hover:border-primary-500/50 hover:bg-slate-600'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {type}
                              </motion.button>
                            ))}
                          </div>
                          <p className="mt-4 text-lg font-bold text-slate-100">
                            ✓ Selected: <span className="text-primary-300">{providerForm.serviceType}</span>
                          </p>
                        </motion.div>

                        {/* Service Description & Specialization */}
                        <motion.div variants={fadeUp}>
                          <label className="mb-4 block text-xl font-black text-white drop-shadow-xl">
                            📝 Service Description & Specialization
                          </label>
                          <textarea
                            name="specialization"
                            rows={7}
                            value={providerForm.specialization}
                            onChange={handleProviderChange}
                            className="w-full rounded-2xl border-4 border-primary-400/70 bg-slate-600 px-6 py-5 text-xl font-semibold text-white placeholder-slate-200 shadow-2xl outline-none transition-all focus:border-primary-300 focus:bg-slate-500 focus:ring-4 focus:ring-primary-400/70 resize-y"
                            placeholder="Describe your services in detail, specializations, certifications, or any specific skills. For example: 'Expert in AC repair, refrigerator servicing, washing machine installation. Certified technician with 5+ years experience. Specialized in home appliance maintenance and repair.'"
                          />
                          <p className="mt-3 text-lg font-bold text-slate-100">
                            ✓ Help customers understand your expertise and what services you offer
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="md:col-span-2" variants={fadeUp}>
                    <div className="mb-6 mt-8 rounded-xl border-2 border-primary-500/30 bg-primary-500/10 p-4">
                      <div className="mb-4 flex items-center justify-center gap-3">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-primary-400 to-primary-400"></div>
                        <p className="text-lg font-extrabold uppercase tracking-wider text-white shadow-lg">
                          📍 Location & Availability
                        </p>
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-primary-400 via-primary-400 to-transparent"></div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <motion.div variants={fadeUp}>
                      <label className="mb-3 block text-lg font-extrabold text-white drop-shadow-lg">
                        Service Area / Job Location <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="serviceArea"
                        required
                        value={providerForm.serviceArea}
                        onChange={handleProviderChange}
                        className="w-full rounded-xl border-3 border-primary-500/50 bg-slate-700 px-5 py-4 text-lg font-medium text-white placeholder-slate-300 shadow-lg outline-none transition-all focus:border-primary-400 focus:bg-slate-600 focus:ring-4 focus:ring-primary-500/50"
                        placeholder="City / Locality / Area"
                      />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                      <label className="mb-3 block text-lg font-extrabold text-white drop-shadow-lg">
                        Available Timings <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="availableTimings"
                        required
                        value={providerForm.availableTimings}
                        onChange={handleProviderChange}
                        placeholder="E.g. 10 AM - 6 PM, Monday to Saturday"
                        className="w-full rounded-xl border-3 border-primary-500/50 bg-slate-700 px-5 py-4 text-lg font-medium text-white placeholder-slate-300 shadow-lg outline-none transition-all focus:border-primary-400 focus:bg-slate-600 focus:ring-4 focus:ring-primary-500/50"
                      />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                      <label className="mb-3 block text-lg font-extrabold text-white drop-shadow-lg">
                        Experience (years, optional)
                      </label>
                      <input
                        name="experienceYears"
                        type="number"
                        value={providerForm.experienceYears}
                        onChange={handleProviderChange}
                        className="w-full rounded-xl border-3 border-primary-500/50 bg-slate-700 px-5 py-4 text-lg font-medium text-white placeholder-slate-300 shadow-lg outline-none transition-all focus:border-primary-400 focus:bg-slate-600 focus:ring-4 focus:ring-primary-500/50"
                        placeholder="Years of experience"
                      />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeUp}>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  name="fullName"
                  required
                  value={customerForm.fullName}
                  onChange={handleCustomerChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter your full name"
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <input
                  name="mobileNumber"
                  type="tel"
                  required
                  value={customerForm.mobileNumber}
                  onChange={handleCustomerChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="+91 9876543210"
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={customerForm.email}
                  onChange={handleCustomerChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="your.email@example.com"
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={customerForm.password}
                  onChange={handleCustomerChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Create a strong password"
                />
              </motion.div>
              <motion.div className="md:col-span-2" variants={fadeUp}>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Service Type <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-3">
                  {['Home', 'Office', 'Both'].map((type) => (
                    <motion.button
                      key={type}
                      type="button"
                      onClick={() =>
                        setCustomerForm((prev) => ({ ...prev, serviceType: type }))
                      }
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                        customerForm.serviceType === type
                          ? 'border-primary-500 bg-primary-600 text-white shadow-lg'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {type === 'Home' && '🏠'} {type === 'Office' && '🏢'}{' '}
                      {type === 'Both' && '🏠🏢'} {type}
                    </motion.button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Select whether you need services for home, office, or both
                </p>
              </motion.div>
              <motion.div className="md:col-span-2" variants={fadeUp}>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Location / Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={customerForm.address}
                  onChange={handleCustomerChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter your complete address"
                />
              </motion.div>
            </motion.div>
          )}

          <motion.div
            className="pt-4 flex gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {role === 'provider' && providerStep === 2 && (
              <motion.button
                type="button"
                onClick={handleProviderBack}
                className="flex-1 rounded-xl border-2 border-slate-600 bg-slate-700 px-6 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-600 hover:shadow-2xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Back
              </motion.button>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              className={`${role === 'provider' && providerStep === 2 ? 'flex-1' : 'w-full'} rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-xl transition-all hover:from-primary-700 hover:to-indigo-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50`}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-xl"
                  >
                    ⏳
                  </motion.span>
                  {role === 'provider' && providerStep === 2 ? 'Creating account...' : 'Creating account...'}
                </span>
              ) : role === 'provider' && providerStep === 1 ? (
                'Next →'
              ) : (
                'Create account'
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

export default SignupPage;
