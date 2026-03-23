/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // dashboard.html palette
        'db-dark': '#13131a',
        'db-panel': '#1e1e2f',
        'db-sidebar': '#181824',
        'db-border': '#2d2d44',
        'db-text': '#a0a0b0',
        'db-purple': '#6c5dd3',
        'db-orange': '#fd7e14',
        'db-red': '#dc3545',
        'db-blue': '#0d6efd',
        'db-green': '#198754',
        // keep old aliases for non-dashboard pages
        coral: '#e8546a',
        cosmic: {
          900: '#13131a',
          800: '#1e1e2f',
          700: '#181824',
          600: '#2d2d44',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
