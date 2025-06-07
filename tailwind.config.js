/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      textColor: {
        DEFAULT: 'var(--text-color)',
        primary: 'var(--text-color-primary)',
        secondary: 'var(--text-color-secondary)',
        DEFAULT: {
          dark: 'var(--text-color-dark)',
        },
        primary: {
          dark: 'var(--text-color-primary-dark)',
        },
        secondary: {
          dark: 'var(--text-color-secondary-dark)',
        },
        slate: {
          600: '#475569',
          '600-dark': '#94a3b8'
        },
        500: {
          DEFAULT: '#64748b',
          dark: '#94a3b8'
        }
      },
      fontMedium: {
        DEFAULT: '#1e293b',
        dark: '#f8fafc'
      },
      input: {
        DEFAULT: {
          text: '#1e293b',
          bg: '#ffffff'
        },
        dark: {
          text: '#f8fafc',
          bg: '#1e293b'
        }
      },
      backgroundColor: {
        DEFAULT: 'var(--bg-color)',
        primary: 'var(--bg-color-primary)',
        secondary: 'var(--bg-color-secondary)',
        DEFAULT: {
          dark: 'var(--bg-color-dark)',
        },
        primary: {
          dark: 'var(--bg-color-primary-dark)',
        },
        secondary: {
          dark: 'var(--bg-color-secondary-dark)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};