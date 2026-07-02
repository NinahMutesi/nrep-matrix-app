import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16322A',
        inkdeep: '#0E211B',
        parchment: '#F6F2E8',
        parchdim: '#ECE5D4',
        amber: '#D98E2B',
        amberdim: '#F0C879',
        clay: '#A14E3C',
        teal: '#3C6E63',
        charcoal: '#262420',
        line: '#D8CFB8',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        seal: '50%',
      },
    },
  },
  plugins: [],
};

export default config;
