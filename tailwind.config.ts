import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nt: {
          primary: '#1B3A6B',
          accent: '#4A90D9',
          bg: '#F4F6FA',
          text: '#374151',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        input: '4px',
      },
    },
  },
  plugins: [],
}

export default config
