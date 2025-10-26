/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f172a",
          muted: "#1e293b",
          raised: "#111827"
        }
      }
    }
  },
  plugins: []
};
