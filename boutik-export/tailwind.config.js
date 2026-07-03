/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
          muted: '#86EFAC',
          soft: '#F0FDF4',
          border: '#BBF7D0',
        },
        slate: {
          950: '#0F172A',
          900: '#1E293B',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50:  '#F8FAFC',
        },
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#16A34A',
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '8px',
        lg: '18px',
        xl: '22px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover': '0 4px 12px rgba(15,23,42,0.08)',
        modal: '0 24px 64px rgba(15,23,42,0.14)',
        brand: '0 4px 14px rgba(22,163,74,0.25)',
      },
    }
  },
  plugins: []
}
