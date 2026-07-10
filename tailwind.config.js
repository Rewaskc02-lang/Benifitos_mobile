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
          DEFAULT: '#1E3D59',
          light: '#2A5478',
          dark: '#142A3E',
        },
        accent: {
          DEFAULT: '#FF6E40',
          light: '#FF8C66',
          dark: '#E5501E',
        },
        secondary: {
          DEFAULT: '#FF6E40',
          light: '#FF8C66',
          dark: '#E5501E',
        },
        background: {
          DEFAULT: '#F5F0E1',
          card: '#FFFFFF',
          elevated: '#EEE9D8',
        },
        surface: '#FFFFFF',
        text: {
          primary: '#1A1F2E',
          secondary: '#4A5568',
          muted: '#8896A5',
        },
        success: {
          DEFAULT: '#1B6B3A',
          light: '#28A85A',
        },
        error: {
          DEFAULT: '#C0392B',
          light: '#E74C3C',
        },
        warning: {
          DEFAULT: '#D97706',
        },
      },
    },
  },
  plugins: [],
};
