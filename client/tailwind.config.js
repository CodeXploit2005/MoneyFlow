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
        // Design system colors based on exact spec
        surface: {
          base: 'var(--color-bg-base)',
          card: 'var(--color-bg-card)',
          sidebar: 'var(--color-bg-sidebar)',
          hover: 'var(--color-bg-hover)',
          active: 'var(--color-bg-active)',
        },
        border: {
          subtle: 'var(--color-border)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        brand: {
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
          950: '#022c22'
        },
        stat: {
          income: '#10b981',
          incomeBg: 'var(--color-stat-income-bg)',
          expense: '#f43f5e',
          expenseBg: 'var(--color-stat-expense-bg)',
          profit: '#3b82f6',
          profitBg: 'var(--color-stat-profit-bg)',
          warranty: '#f59e0b',
          warrantyBg: 'var(--color-stat-warranty-bg)',
        }
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card-light': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'pill-active': '0 2px 6px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
