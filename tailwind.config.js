/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b0b9c8',
          400: '#8492a8',
          500: '#64748b',
          600: '#4d5a6e',
          700: '#3f4a5a',
          800: '#2b333f',
          900: '#1b212a',
          950: '#0f1319',
        },
        brand: {
          50: '#eefbf4',
          100: '#d6f5e4',
          200: '#b0e9cd',
          300: '#7bd7ae',
          400: '#43bd8b',
          500: '#1fa270',
          600: '#12825b',
          700: '#0f684b',
          800: '#0f523d',
          900: '#0d4434',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        pop: '0 12px 32px -8px rgba(16,24,40,.18), 0 2px 8px rgba(16,24,40,.06)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .18s ease-out both' },
    },
  },
  plugins: [],
}
