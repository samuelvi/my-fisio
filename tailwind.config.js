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
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          darker: 'rgb(var(--color-primary-darker) / <alpha-value>)',
          selected: 'rgb(var(--color-primary-selected) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
