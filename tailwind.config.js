/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dink: {
          dark: '#2f184b',
          mid: '#3b1f5f',
          light: '#4e2d73',
          white: '#f7f4ff',
          muted: '#b89dde',
          soft: '#a88ed0',
          lavenderA: '#c7a7ff',
          lavenderB: '#8f63f4',
          goldA: '#f6c445',
          goldB: '#e4b63f',
          mint: '#67f5d1',
          danger: '#f28b9c',
        },
      },
      boxShadow: {
        dink: '0 22px 40px rgba(14, 4, 26, 0.35)',
        'dink-soft': '0 12px 24px rgba(10, 4, 20, 0.18)',
        glow: '0 0 30px rgba(199, 167, 255, 0.18)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.25rem',
      },
    },
  },
  plugins: [],
};
