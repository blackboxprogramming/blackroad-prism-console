import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}',
    './stories/**/*.{js,ts,jsx,tsx}'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./stories/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6E59F5',
          dark: '#4A3ABD'
          50: "#f5f9ff",
          100: "#dce9ff",
          200: "#b3ceff",
          300: "#86afff",
          400: "#5a90ff",
          500: "#2d72fe",
          600: "#1d56d9",
          700: "#1541ad",
          800: "#0d2b78",
          900: "#061640"
        }
      }
    }
  },
  plugins: []
};

export default config;
