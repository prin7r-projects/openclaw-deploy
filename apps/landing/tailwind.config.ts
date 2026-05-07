import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cold Iron palette
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
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '6px',
        md: '6px',
        lg: '10px',
        xl: '14px',
      },
      animation: {
        'pulse-signal': 'pulseSignal 1.6s ease-in-out infinite',
        'blink-alert': 'blinkAlert 2s steps(2, end) infinite',
      },
      keyframes: {
        pulseSignal: {
          '0%, 100%': { boxShadow: '0 0 0 3px rgba(124,255,161,0.18)' },
          '50%': { boxShadow: '0 0 0 6px rgba(124,255,161,0.34)' },
        },
        blinkAlert: {
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
