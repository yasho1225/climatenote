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
          deep: '#152318',
          mid: '#1f3323',
          glow: '#8ba88e',
          accent: '#6d9470',
        },
        cream: '#f5f7f4',
        earth: {
          DEFAULT: '#6b4f3a',
          neutral: '#6b4f3a',
        },
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
        elevated: '0 8px 32px -6px rgba(21, 35, 24, 0.18)',
        float: '0 -8px 40px -8px rgba(21, 35, 24, 0.14)',
        btn: '0 6px 20px -4px rgba(45, 74, 50, 0.35)',
      },
      backgroundImage: {
        'forest-gradient': 'linear-gradient(135deg, #4a634e 0%, #6d9470 50%, #8ba88e 100%)',
        'forest-deep': 'linear-gradient(175deg, #152318 0%, #2d4a32 50%, #8ba88e 100%)',
      },
    },
  },
  plugins: [],
};
