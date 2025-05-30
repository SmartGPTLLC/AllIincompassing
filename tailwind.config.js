/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom colors for dark mode
        dark: {
          DEFAULT: '#1a1b1e',
          lighter: '#2c2d31',
          border: '#2c2d31',
        },
      },
    },
  },
  plugins: [],
};