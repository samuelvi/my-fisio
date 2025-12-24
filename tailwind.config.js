/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./assets/**/*.{js,jsx,ts,tsx}",
    "./templates/**/*.html.twig",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          light: '#6366f1',   // indigo-500
          dark: '#4338ca',    // indigo-700
          darker: '#3730a3',  // indigo-800
        }
      }
    },
  },
  plugins: [],
}
