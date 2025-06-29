// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'test-purple': '#800080',
        'section-pink': '#FFE5E5',
        'section-black': '#000000',
      },
      fontFamily: {
        'work-sans': ['var(--font-work-sans)'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};

export default config;