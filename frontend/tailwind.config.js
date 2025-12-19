/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563EB',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        campusIndigo: {
          500: '#6366F1',
        },
        campusBg: '#F8FAFC',
        campusText: '#0F172A',
        campusMuted: '#64748B',
      },
    },
  },
  plugins: [],
};


