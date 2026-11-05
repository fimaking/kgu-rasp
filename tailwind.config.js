/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-family-app)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
      },
      colors: {
        ticktick: {
          blue: '#2B82FB',
          hover: '#2072E5',
          darkBlue: '#1668E3',
          lightBlue: '#E8F2FF',
          orange: '#FA8C16',
          today: '#F59E0B',
          red: '#EF4444',
          green: '#10B981',
          purple: '#8B5CF6',
          bgDark: '#181818',
          sidebarDark: '#1F1F1F',
          cardDark: '#242424',
          hoverDark: '#2C2C2C',
          borderDark: '#2E2E2E',
          bgLight: '#F5F6F8',
          sidebarLight: '#FFFFFF',
          cardLight: '#FFFFFF',
          hoverLight: '#F0F2F5',
          borderLight: '#E5E7EB',
        },
        apple: {
          blue: 'rgb(var(--color-accent-rgb, 43 130 251) / <alpha-value>)',
          indigo: '#5856D6',
          purple: '#8B5CF6',
          pink: '#EC4899',
          red: '#EF4444',
          orange: '#FA8C16',
          yellow: '#F59E0B',
          green: '#10B981',
          mint: '#14B8A6',
          teal: '#06B6D4',
          cyan: '#0EA5E9',
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
            950: '#000000'
          }
        }
      },
      boxShadow: {
        'ticktick-sm': '0 1px 2px rgba(0,0,0,0.06)',
        'ticktick-card': '0 2px 8px rgba(0,0,0,0.08)',
        'ticktick-hover': '0 4px 14px rgba(0,0,0,0.12)',
        'ticktick-blue': '0 4px 14px rgba(43, 130, 251, 0.35)',
        'apple-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'apple-card': '0 2px 8px rgba(0,0,0,0.06)',
        'apple-hover': '0 4px 16px rgba(0,0,0,0.1)',
        'apple-float': '0 10px 25px rgba(0,0,0,0.15)',
        'apple-dark': '0 2px 10px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        '2.5xl': '1.125rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
