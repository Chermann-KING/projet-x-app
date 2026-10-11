const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'oklch(var(--success) / <alpha-value>)',
          foreground: 'oklch(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'oklch(var(--warning) / <alpha-value>)',
          foreground: 'oklch(var(--warning-foreground) / <alpha-value>)',
        },
        ring: 'oklch(var(--ring) / <alpha-value>)',
      },
      borderRadius: {
        card: '14px',
        btn: '12px',
        badge: '100px',
      },
      fontFamily: {
        sans: ['NunitoSans', ...fontFamily.sans],
        heading: ['BricolageGrotesque', ...fontFamily.sans],
      },
      fontSize: {
        h1: ['28px', { fontWeight: '700', lineHeight: '34px' }],
        h2: ['22px', { fontWeight: '600', lineHeight: '28px' }],
        h3: ['18px', { fontWeight: '600', lineHeight: '24px' }],
        body: ['15px', { fontWeight: '400', lineHeight: '22px' }],
        label: ['13px', { fontWeight: '500', lineHeight: '18px' }],
        caption: ['12px', { fontWeight: '400', lineHeight: '16px' }],
      },
      spacing: {
        'padding-h': '16px',
        'tab-bar': '80px',
        header: '56px',
        input: '52px',
        btn: '48px',
      },
    },
  },
  plugins: [],
}
