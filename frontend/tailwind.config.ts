import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pp: {
          bg:          '#0C1220',
          surface:     '#141C26',
          raised:      '#1A2230',
          border:      '#2A3040',
          'border-sub':'#1E2530',
          text:        '#E2E8F0',
          secondary:   '#8892A2',
          tertiary:    '#5A6478',
          blue:        '#2B6CB0',
          'blue-hover':'#3B82C8',
          'blue-sub':  '#162A4A',
          teal:        '#319795',
          'teal-glow': '#2DD4BF',
          'teal-sub':  '#0F2B2A',
          green:       '#34D399',
          'green-sub': '#0A2E1F',
          orange:      '#F59E0B',
          'orange-sub':'#2A1A05',
          red:         '#EF4444',
          'red-sub':   '#2A0A0A',
          amount:      '#5EEAD4',
        }
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        head:  ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse-dot 2.5s ease-in-out infinite',
        'materialize': 'materialize 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 6px #319795' },
          '50%': { opacity: '0.5', boxShadow: '0 0 14px #2DD4BF, 0 0 28px #319795' },
        },
        'materialize': {
          '0%': {
            borderColor: 'rgba(49, 151, 149, 0.7)',
            boxShadow: '0 0 24px rgba(45, 212, 191, 0.3), inset 0 0 16px rgba(49, 151, 149, 0.08)',
            opacity: '0',
            transform: 'scale(0.97)',
          },
          '40%': { opacity: '1', transform: 'scale(1)' },
          '100%': {
            borderColor: 'rgba(49, 151, 149, 0.2)',
            boxShadow: 'none',
          },
        },
      },
    }
  },
  plugins: [],
};

export default config;
