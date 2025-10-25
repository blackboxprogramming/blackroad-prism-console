import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}'
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f9ff',
          100: '#e0f2ff',
          200: '#b9e2ff',
          300: '#7bcbff',
          400: '#36a9ff',
          500: '#0d87ff',
          600: '#0069d6',
          700: '#0052a8',
          800: '#003d7f',
          900: '#002b59'
        }
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }]
      },
      outlineColor: {
        brand: '#0d87ff'
      }
    }
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.focus-outline': {
          outline: '2px solid theme("colors.brand.500")',
          outlineOffset: '2px'
        }
      });
    })
  ]
};

export default config;
