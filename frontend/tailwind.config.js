/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        teal: {
          DEFAULT: 'rgb(var(--color-teal) / <alpha-value>)',
          dark: 'rgb(var(--color-teal-dark) / <alpha-value>)',
          light: 'rgb(var(--color-teal-light) / <alpha-value>)',
        },
        moss: 'rgb(var(--color-moss) / <alpha-value>)',
        sand: 'rgb(var(--color-sand) / <alpha-value>)',
        danger: '#9f1239',
        dangerSoft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        header: 'var(--shadow-header)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
