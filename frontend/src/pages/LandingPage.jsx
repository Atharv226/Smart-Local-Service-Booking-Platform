import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
});

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1, delayChildren: 0.2 },
};

function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const headerY = useTransform(scrollYProgress, [0, 0.1], [0, -10]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
      {/* Sticky header with scroll animation */}
      <motion.header
        style={{ opacity: headerOpacity, y: headerY }}
        className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-slate-900/50"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:py-5">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Smart Local
            </motion.span>
            <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 md:block">
              Service Booking Platform
            </span>
          </motion.div>
          <motion.nav
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg transition-all"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle dark mode"
            >
              <motion.span
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="text-xl"
              >
                {isDark ? '🌙' : '☀️'}
              </motion.span>
            </motion.button>
            <Link
              to="/login"
              className="rounded-full px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
            >
              Login
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:from-primary-700 hover:to-indigo-700"
              >
                Sign Up
              </Link>
            </motion.div>
          </motion.nav>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero Section with Parallax */}
        <section className="relative overflow-hidden border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-primary-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          {/* Animated background elements */}
          <motion.div
            className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-2 md:py-24 lg:py-28">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200/50 dark:border-emerald-800/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.span
                  className="h-2 w-2 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Live · Verified Providers · Blockchain Identity
              </motion.div>

              <motion.h1
                className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Trusted Local Services
                <br />
                <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                  Smart, Secure & Fast
                </span>
              </motion.h1>

              <motion.p
                className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Connect with verified local service providers—plumbers, electricians, mechanics,
                and more. Real-time tracking, QR verification, and flexible payments all in one
                platform.
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup"
                    className="inline-block rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:from-primary-700 hover:to-indigo-700"
                  >
                    Get Started Free
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="inline-block rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 transition-all hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    I have an account
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                className="grid gap-4 pt-4 md:grid-cols-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  {
                    title: 'For Customers',
                    items: [
                      'Verified providers with ratings',
                      'Real-time map tracking',
                      'QR identity verification',
                      'Flexible payment options',
                    ],
                  },
                  {
                    title: 'For Providers',
                    items: [
                      'Blockchain digital identity',
                      'Smart job dashboard',
                      'Instant payouts',
                      'Build your reputation',
                    ],
                  },
                ].map((card, idx) => (
                  <motion.div
                    key={card.title}
                    className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + idx * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                      {card.title}
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {card.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 text-primary-600 dark:text-primary-400">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right side animated visualization */}
            <motion.div
              className="relative hidden h-[500px] md:flex md:items-center md:justify-center"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {/* Animated service icons floating */}
              <div className="relative h-full w-full max-w-md">
                {/* Central pulsing circle */}
                <motion.div
                  className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary-400/20 to-indigo-400/20 dark:from-primary-500/30 dark:to-indigo-500/30 blur-2xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Floating service provider icons */}
                {[
                  { icon: '🔧', label: 'Plumber', delay: 0, x: -80, y: -60 },
                  { icon: '⚡', label: 'Electrician', delay: 0.2, x: 80, y: -60 },
                  { icon: '🔨', label: 'Carpenter', delay: 0.4, x: -80, y: 60 },
                  { icon: '🚗', label: 'Mechanic', delay: 0.6, x: 80, y: 60 },
                  { icon: '🧹', label: 'Cleaner', delay: 0.8, x: 0, y: -100 },
                  { icon: '💡', label: 'Handyman', delay: 1, x: 0, y: 100 },
                ].map((service, idx) => (
                  <motion.div
                    key={service.label}
                    className="absolute left-1/2 top-1/2 flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.5 + service.delay,
                      type: 'spring',
                      stiffness: 200,
                    }}
                  >
                    <motion.div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-primary-200 dark:border-primary-800 shadow-xl text-2xl"
                      animate={{
                        x: [0, service.x, 0],
                        y: [0, service.y, 0],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4 + idx * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: idx * 0.3,
                      }}
                      whileHover={{ scale: 1.2, zIndex: 10 }}
                    >
                      {service.icon}
                    </motion.div>
                    <motion.span
                      className="rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 text-[0.65rem] font-bold text-slate-700 dark:text-slate-200 shadow-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 + service.delay }}
                    >
                      {service.label}
                    </motion.span>
                  </motion.div>
                ))}

                {/* Animated connection lines */}
                <svg className="absolute inset-0 h-full w-full opacity-20 dark:opacity-10">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.line
                      key={i}
                      x1="50%"
                      y1="50%"
                      x2={`${50 + Math.cos((i * Math.PI) / 3) * 30}%`}
                      y2={`${50 + Math.sin((i * Math.PI) / 3) * 30}%`}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary-500 dark:text-primary-400"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </svg>

                {/* QR Code animation */}
                <motion.div
                  className="absolute right-0 top-0 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl text-3xl"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                  }}
                >
                  📷
                </motion.div>

                {/* Payment icons floating */}
                <motion.div
                  className="absolute bottom-0 left-0 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-xl text-2xl"
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  💳
                </motion.div>

                {/* Map tracking icon */}
                <motion.div
                  className="absolute bottom-0 right-0 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-xl text-2xl"
                  animate={{
                    x: [0, 10, -10, 0],
                    y: [0, -10, 10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  🗺️
                </motion.div>

                {/* Blockchain badge */}
                <motion.div
                  className="absolute left-0 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 shadow-xl text-xl"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                  }}
                >
                  ⛓️
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 py-16 md:py-20">
          <motion.div
            className="mx-auto max-w-5xl px-4"
            {...fadeUp(0.1)}
          >
            <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
              Built for{' '}
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                Trust, Safety & Speed
              </span>
            </h2>
            <motion.p
              className="mx-auto mt-6 max-w-3xl text-center text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg"
              {...fadeUp(0.2)}
            >
              Smart Local verifies every service provider, tracks every visit, and provides a
              clear, auditable trail—from booking to payout. No guesswork, no unverified
              strangers at your door.
            </motion.p>
          </motion.div>
        </section>

        {/* Benefits Section */}
        <section className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <motion.h2
              className="text-center text-3xl font-bold text-slate-900 dark:text-white md:text-4xl"
              {...fadeUp(0.1)}
            >
              Why Everyone Loves Smart Local
            </motion.h2>

            <motion.div
              className="mt-12 grid gap-6 md:grid-cols-2"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              {[
                {
                  title: 'For Customers',
                  color: 'primary',
                  benefits: [
                    {
                      icon: '✓',
                      title: 'Verified Providers',
                      desc: 'Every provider has blockchain-backed ID and job history.',
                    },
                    {
                      icon: '📍',
                      title: 'Real-time Tracking',
                      desc: 'Watch provider journey on Google Maps with live ETA.',
                    },
                    {
                      icon: '📷',
                      title: 'QR Verification',
                      desc: 'Scan QR to confirm you\'re opening door to right person.',
                    },
                    {
                      icon: '💳',
                      title: 'Flexible Payments',
                      desc: 'Pay via cash, UPI/card, or blockchain wallet.',
                    },
                  ],
                },
                {
                  title: 'For Service Providers',
                  color: 'emerald',
                  benefits: [
                    {
                      icon: '🔍',
                      title: 'More Jobs',
                      desc: 'Get discovered by nearby customers searching for your skills.',
                    },
                    {
                      icon: '🆔',
                      title: 'Digital Identity',
                      desc: 'Your rating and identity live securely on-chain.',
                    },
                    {
                      icon: '📊',
                      title: 'Smart Dashboard',
                      desc: 'Accept/reject jobs, manage schedule, track earnings.',
                    },
                    {
                      icon: '💰',
                      title: 'Instant Payouts',
                      desc: 'Get paid via offline, online, or blockchain wallet.',
                    },
                  ],
                },
              ].map((section, idx) => (
                <motion.div
                  key={section.title}
                  className="rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-8 shadow-xl transition-all hover:shadow-2xl"
                  variants={fadeUp(0.1 + idx * 0.1)}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <p className="mb-6 text-sm font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                    {section.title}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.benefits.map((benefit, i) => (
                      <motion.div
                        key={benefit.title}
                        className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <p className="mb-2 text-lg">{benefit.icon}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {benefit.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          {benefit.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <motion.h2
              className="text-center text-3xl font-bold text-slate-900 dark:text-white md:text-4xl"
              {...fadeUp(0.1)}
            >
              How It Works
            </motion.h2>

            <motion.div
              className="mt-12 grid gap-6 md:grid-cols-5"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              {[
                { step: '1', title: 'Sign Up', desc: 'Create account as customer or provider.' },
                { step: '2', title: 'Choose Role', desc: 'Decide if booking or offering services.' },
                { step: '3', title: 'Book / Accept', desc: 'Customers send requests; providers accept.' },
                { step: '4', title: 'Track & Verify', desc: 'Track on Maps and verify with QR scan.' },
                { step: '5', title: 'Pay Securely', desc: 'Complete payment via your preferred method.' },
              ].map((item, idx) => (
                <motion.div
                  key={item.step}
                  className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 shadow-lg transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl"
                  variants={fadeUp(0.1 + idx * 0.1)}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 text-sm font-bold text-white shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {item.step}
                  </motion.span>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
                  {idx < 4 && (
                    <motion.span
                      className="pointer-events-none absolute -right-3 top-1/2 hidden h-0.5 w-6 bg-gradient-to-r from-primary-400 to-indigo-400 md:block"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 + 0.3 }}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 dark:from-slate-950 dark:via-black dark:to-slate-950 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <motion.h2
              className="text-center text-3xl font-bold text-white md:text-4xl"
              {...fadeUp(0.1)}
            >
              Technology You Can Trust
            </motion.h2>
            <motion.p
              className="mx-auto mt-6 max-w-3xl text-center text-base text-slate-300 md:text-lg"
              {...fadeUp(0.2)}
            >
              Built with modern tech stack: JWT authentication, MongoDB, mocked Polygon
              blockchain, QR codes, and Google Maps integration.
            </motion.p>

            <motion.div
              className="mt-12 grid gap-6 md:grid-cols-4"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              {[
                { icon: '⛓️', title: 'Blockchain Identity', desc: 'Unique on-chain provider IDs.' },
                { icon: '📷', title: 'QR Verification', desc: 'Scan to confirm provider identity.' },
                { icon: '🔐', title: 'Secure Auth (JWT)', desc: 'Protected APIs with role checks.' },
                { icon: '🗺️', title: 'Maps & Tracking', desc: 'Google Maps for live location.' },
              ].map((tech, idx) => (
                <motion.div
                  key={tech.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
                  variants={fadeUp(0.1 + idx * 0.1)}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <p className="mb-3 text-3xl">{tech.icon}</p>
                  <p className="text-base font-bold text-white">{tech.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{tech.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 dark:bg-black py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-lg font-bold text-white">Smart Local</p>
                <p className="mt-2 text-sm text-slate-400">
                  Service Booking Platform · Built with React, Tailwind, Node.js, Express, MongoDB
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {['Contact', 'Terms', 'Privacy'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LandingPage;
