/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'ios': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'ios-card': '0 4px 20px -2px rgba(2, 132, 199, 0.12)',
        'ios-button': '0 8px 24px -4px rgba(2, 132, 199, 0.35)',
      },
      borderRadius: {
        'ios': '1.25rem',
        'ios-xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
