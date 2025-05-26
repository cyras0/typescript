import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2563eb',
        'primary-blue-100': '#dbeafe',
        'black-100': '#2B2C35',
        'grey': '#6B7280',
        'light-white': '#F3F4F6',
      },
      backgroundImage: {
        'hero-bg': "url('/hero-bg.png')",
        'pattern': "url('/pattern.png')",
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}

export default config 