import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        ink: '#1a1a1a',
        cream: '#faf7f2',
        tomato: '#e2553b',
        olive: '#6b7d4a',
      },
    },
  },
  plugins: [],
};

export default config;
