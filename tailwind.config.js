/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        camfit: {
          DEFAULT: '#01DF82',
          50: '#E6FFF3',
          100: '#B3FFDB',
          200: '#66FFC0',
          300: '#33FFA5',
          400: '#01DF82',
          500: '#01DF82',
          600: '#00C46E',
          700: '#00A85C',
          800: '#008A4B',
          900: '#006637',
        },
        brand: {
          blue: '#1975FF',
          lime: '#C9FF00',
          purple: '#727CF5',
          red: '#FF383C',
          orange: '#FF7300',
          amber: '#FFC107',
          violet: '#9047FF',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
