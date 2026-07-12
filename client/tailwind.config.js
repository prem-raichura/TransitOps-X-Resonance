/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f5b301', // TransitOps yellow (mockup)
          dark: '#21313f', // sidebar/header navy
        },
        // Landing palette
        ocean: {
          deep: '#355872', // primary deep blue
          mid: '#7AAACE', // secondary blue
          light: '#9CD5FF', // light accent blue
        },
        sunset: '#F78F00', // warm accent (orange)
      },
    },
  },
  plugins: [],
}
