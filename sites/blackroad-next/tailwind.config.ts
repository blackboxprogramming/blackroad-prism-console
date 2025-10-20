import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { 900: "#0B1020", 800: "#0F1428", 700: "#121936" },
        pinky: { 400: "#ff5ab8", 500: "#ff3ea5", 600: "#e01786" }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(255,62,165,.15)"
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" }
    },
  },
  plugins: [],
};
export default config;
