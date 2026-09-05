/** @type {import('tailwindcss').Config} */

/* Two themes live in this product.
 *
 * The default (`:root` in src/index.css) is the original restaurant theme:
 * cool slate neutrals, the mint-leaning brand green, a dark sidebar, lifted
 * cards. The e-commerce workspace opts into a second set of values by putting
 * `data-theme="ecom"` on its shell.
 *
 * Every token below therefore resolves through a CSS variable rather than a
 * literal, so `bg-ink-50` means one colour on /dashboard and another on
 * /ecommerce/overview without a single call site knowing about it. Variables
 * hold space-separated RGB channels so Tailwind's `/opacity` modifiers
 * (`bg-ink-900/20`) keep working.
 */
const ink = (n) => `rgb(var(--ink-${n}) / <alpha-value>)`
const brand = (n) => `rgb(var(--brand-${n}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: ink(50),
          100: ink(100),
          200: ink(200),
          300: ink(300),
          400: ink(400),
          500: ink(500),
          600: ink(600),
          700: ink(700),
          800: ink(800),
          900: ink(900),
          950: ink(950),
        },
        brand: {
          50: brand(50),
          100: brand(100),
          200: brand(200),
          300: brand(300),
          400: brand(400),
          500: brand(500),
          600: brand(600),
          700: brand(700),
          800: brand(800),
          900: brand(900),
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .18s ease-out both' },
    },
  },
  plugins: [],
}
