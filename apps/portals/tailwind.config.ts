import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          start: "#FFB000",
          mid: "#FF2D95",
          end: "#5B8CFF",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(to right, #FFB000, #FF2D95, #5B8CFF)",
      },
    },
  },
  plugins: [],
};

export default config;
