/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,jsx,tsx}',
    './index.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B54D6',   // desaturated purple (was #6C63FF)
          light: '#7B76E8',
          dark: '#3D37A8',
        },
        secondary: {
          DEFAULT: '#D6566E',   // muted rose error (was #FF6584) — kept for legacy className usage
          light: '#E07A8F',
          dark: '#A83348',
        },
        background: {
          DEFAULT: '#0F0F1A',
          card: '#16162A',      // was #1A1A2E
          elevated: '#252545',
        },
        surface: '#16162A',
        accent: '#3D9DB8',      // muted teal (was #00D2FF)
        text: {
          primary: '#EDEDF5',   // was #F0F0FF
          secondary: '#9999BB',
          muted: '#555577',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
