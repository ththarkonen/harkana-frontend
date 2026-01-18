/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#d33479',
        'brand-light': '#e65f9a',
        'brand-dark': '#a91f5e',
      },
    },
  },
  plugins: [],
}