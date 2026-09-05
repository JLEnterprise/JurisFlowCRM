/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legal Executive Dark Palette
        obsidian: {
          900: '#111827',
          950: '#0b0f17',
          1000: '#070a10',
        },
        navy: {
          800: '#141e33',
          850: '#0f172a',
          900: '#0b1120',
          950: '#070c18',
        },
        // Imperial Blue
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a8f6',
          500: '#0c8de3',
          600: '#016fc2',
          700: '#02589e',
          800: '#064b82',
          900: '#0b3f6d',
          950: '#072848',
        },
        // Champagne Gold / Bronze Nobre
        gold: {
          50: '#fbf9f1',
          100: '#f6f0dd',
          200: '#ede0bc',
          300: '#dfcb92',
          400: '#d0b064',
          500: '#c5a059', // Champagne Gold Principal
          600: '#b48a43',
          700: '#956d35',
          800: '#7a572f',
          900: '#66482a',
          950: '#3c2715',
        },
        // Emerald Discreto
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        'glass-dark': '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
        'glow-brand': '0 0 25px -4px rgba(12, 141, 227, 0.4)',
        'glow-gold': '0 0 25px -4px rgba(197, 160, 89, 0.35)',
        'glow-emerald': '0 0 20px -4px rgba(16, 185, 129, 0.35)',
        'executive': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'executive-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.07)',
      }
    },
  },
  plugins: [],
}
