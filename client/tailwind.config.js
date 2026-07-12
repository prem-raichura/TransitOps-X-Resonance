/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f5b301', // TransitOps yellow (mockup)
          dark: '#21313f', // sidebar/header navy
        },
      },
    },
  },
  plugins: [],
}
