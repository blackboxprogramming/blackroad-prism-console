/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0e1116",
        accent: {
          DEFAULT: "#66d9ff",
          muted: "#1f2933"
        }
      }
    }
  },
  plugins: []
};
