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
        // Cold Iron monochrome palette (Wave 2 retokenization, PRI-3519).
        // Brand accent colors were removed to comply with the Wave One
        // white/neutral/taste standard. State is encoded by lightness only:
        // off-white = running/healthy, light-gray = warn/drift, mid-gray = muted.
        // The previous phosphor-green / amber / coral / violet tokens
        // (signal #7CFFA1, warn #FFC857, alert #FF6B6B, tok-ref #C4B5FD) have
        // been retired. Status meaning is carried by labels, not by hue.
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
        // Monochrome state tokens (no chromatic brand accents).
        // All map to the same neutral grays regardless of semantic role
        // (running / drift / draining / error) — see docs/01-brand-identity.md.
        signal: '#E6ECF2', // was phosphor green #7CFFA1
        warn: '#B8B8B8',   // was amber #FFC857
        alert: '#6B6B6B',  // was coral #FF6B6B
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
        // Status pulses now modulate light gray, not phosphor green.
        'pulse-signal': 'pulseSignal 1.6s ease-in-out infinite',
        'blink-alert': 'blinkAlert 2s steps(2, end) infinite',
      },
      keyframes: {
        pulseSignal: {
          '0%, 100%': { boxShadow: '0 0 0 3px rgba(230,236,242,0.10)' },
          '50%': { boxShadow: '0 0 0 6px rgba(230,236,242,0.22)' },
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
