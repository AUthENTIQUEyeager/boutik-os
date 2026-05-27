/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        ink: { DEFAULT: '#111111', light: '#444444', muted: '#888888' },
        paper: { DEFAULT: '#ffffff', soft: '#f8f8f8', border: '#e8e8e8' },
        accent: { DEFAULT: '#111111', success: '#16a34a', warning: '#d97706', danger: '#dc2626' }
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'modal': '0 20px 60px rgba(0,0,0,0.12)',
        'nav': '0 -1px 0 rgba(0,0,0,0.06)'
      },
      borderRadius: { 'xl': '12px', '2xl': '16px' }
    }
  },
  plugins: []
}
