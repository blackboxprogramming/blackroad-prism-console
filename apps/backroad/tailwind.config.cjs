/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f5ff',
          100: '#e6e6ff',
          200: '#c4c5ff',
          300: '#9fa3ff',
          400: '#6c70ff',
          500: '#4045ff',
          600: '#292ee6',
          700: '#2024b3',
          800: '#181b80',
          900: '#11124d',
        },
      },
    },
  },
  plugins: [],
};
