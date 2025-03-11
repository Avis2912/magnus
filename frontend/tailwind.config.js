/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ai-green': '#10A37F',
        'ai-green-dark': '#0D8A6C',
        'ai-border': '#363636',
        'ai-bg-primary': '#000000',
        'ai-bg-secondary': '#111111',
        'ai-bg-tertiary': '#222222',
        'ai-text-primary': '#FFFFFF',
        'ai-text-secondary': '#BBBBBB',
        'ai-text-tertiary': '#777777',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(0.8)' },
          '50%': { opacity: 0.8, transform: 'scale(1.0)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(30px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeInLogo: {
          '0%': { opacity: 0 },
          '20%': { opacity: 1 },
          '85%': { opacity: 1 },
          '100%': { opacity: 0 },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        pulse: 'pulse 1.5s infinite ease-in-out',
        slideIn: 'slideIn 0.3s forwards',
        fadeInLogo: 'fadeInLogo 2.5s forwards',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['var(--font-raleway)', 'sans-serif'],
        serif: ['"IM Fell Great Primer"', 'serif'],
        brand: ['"IM Fell Great Primer"', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
