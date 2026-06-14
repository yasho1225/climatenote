/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e8efe8',
          200: '#d4e2d4',
          300: '#b5cdb5',
          400: '#8ba88e',
          500: '#6d9470',
          600: '#4a634e',
          700: '#3d5240',
          800: '#2d4a32',
          900: '#1f3323',
        },
        forest: {
          DEFAULT: '#2d4a32',
          light: '#4a634e',
          dark: '#1f3323',
        },
        cream: '#f5f7f4',
        earth: '#6b4f3a',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(45, 74, 50, 0.12)',
        card: '0 2px 16px -2px rgba(45, 74, 50, 0.08)',
      },
    },
  },
  plugins: [],
};
