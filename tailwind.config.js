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
        brand: '#3b82f6',      // The specific bright blue
        bg: '#09090b',         // The deep black background
        surface: '#18181b',    // The card background
        border: '#27272a'      // The subtle border
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'login-glow': "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)"
      }
    },
  },
  plugins: [],
}