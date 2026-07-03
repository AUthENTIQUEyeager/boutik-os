/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#16A34A', light: '#22C55E', soft: '#F0FDF4', border: '#BBF7D0' },
        slate: { 950: '#0F172A', 900: '#1E293B', 700: '#334155', 500: '#64748B', 200: '#E2E8F0', 50: '#F8FAFC' },
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: '10px', sm: '12px', base: '14px', lg: '16px', xl: '20px', '2xl': '24px',
      },
      borderRadius: {
        card: '14px', btn: '10px', input: '10px', modal: '22px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15,23,42,0.06)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
