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
        signal: '#7CFFA1',
        warn: '#FFC857',
        alert: '#FF6B6B',
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
