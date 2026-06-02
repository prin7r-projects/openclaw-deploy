import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cold Iron monochrome palette (Wave 2 retokenization, PRI-3519).
        // See apps/landing/tailwind.config.ts for the canonical token table.
        // Phosphor green / amber / coral were removed; the surface now uses
        // only off-white, neutral gray, and near-black. Status meaning is
        // carried by labels next to the dot, never by hue.
        surface: {
          0: '#0B0E12',
          1: '#11161D',
          2: '#1B232E',
        },
        border: {
          DEFAULT: '#27313F',
          subtle: '#1F2733',
        },
        text: {
          primary: '#E6ECF2',
          muted: '#7E8A9A',
        },
        signal: '#E6ECF2', // was phosphor green #7CFFA1
        warn: '#B8B8B8',   // was amber #FFC857
        alert: '#6B6B6B',  // was coral #FF6B6B
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
        xl: '14px',
      },
      keyframes: {
        'pulse-signal': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'blink-alert': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-signal': 'pulse-signal 1.6s ease-in-out infinite',
        'blink-alert': 'blink-alert 2s steps(2) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
