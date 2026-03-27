/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        chrome: {
          50: '#fafafa',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#c0c0c0',
          400: '#a0a0a0',
          500: '#808080',
          600: '#606060',
          700: '#404040',
          800: '#2a2a2a',
          900: '#1a1a1a',
          950: '#0d0d0d',
        }
      }
    },
  },
  plugins: [],
}
