/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 900: '#312e81' },
        surface: { 0: '#0a0a0f', 1: '#12121a', 2: '#1a1a25', 3: '#222230', 4: '#2a2a3a' },
      },
    },
  },
  plugins: [],
};
