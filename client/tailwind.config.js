/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc', // Slate 50
        surface: '#ffffff',
        primary: '#64748b', // Slate 500
        secondary: '#94a3b8', // Slate 400
        accent: '#0f172a', // Slate 900
        danger: '#ef4444',
        success: '#22c55e',
        'soft-border': '#e2e8f0',
        // Legacy colors for compatibility
        'soft-light': '#fdfaf6',
        'soft-dark': '#2c2c2c',
        'sage': '#a3b18a',
        'muted-gold': '#dda15e',
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'breath': 'breath 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
