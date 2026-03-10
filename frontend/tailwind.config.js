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
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: {
          light: '#3b82f6', // lighter blue for hover
          DEFAULT: '#0070f3', // Electric Blue
          dark: '#005bb5',
        },
        orange: {
          light: '#fb923c',
          DEFAULT: '#f97316', // Safety Orange
          dark: '#ea580c',
        },
        danger: {
          DEFAULT: '#ef4444', // Red
          dark: '#b91c1c',
        },
        warning: {
          DEFAULT: '#eab308', // Yellow
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
