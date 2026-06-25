/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Refined earthy palette — readable on white, calm on canvas */
        canvas: '#EEF2EC',
        mist: '#E6ECE3',
        sage: {
          50: '#F4F7F3',
          100: '#E4EDE4',
          200: '#CDD9CD',
          300: '#A8BAA8',
          400: '#7F9A82',
          500: '#5F7D62',
          600: '#4A634E',
          700: '#3D5240',
          800: '#2F4233',
          900: '#243328',
        },
        forest: {
          DEFAULT: '#2F4233',
          light: '#4A634E',
          dark: '#243328',
          deep: '#1A2B20',
          mid: '#2F4233',
          glow: '#8BA88E',
          accent: '#5F7D62',
        },
        canopy: {
          DEFAULT: '#3A5240',
          muted: '#5C6B5E',
        },
        cream: '#EEF2EC',
        earth: {
          DEFAULT: '#6B5E52',
          warm: '#5C564E',
          light: '#8A7F72',
        },
        terracotta: {
          DEFAULT: '#B86B52',
          light: '#F3E4DC',
          muted: '#C4785A',
        },
        ink: {
          DEFAULT: '#2C3429',
          soft: '#4A5248',
          muted: '#8A9289',
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
        soft: '0 4px 24px -4px rgba(36, 51, 40, 0.1)',
        card: '0 2px 14px -2px rgba(36, 51, 40, 0.07)',
        elevated: '0 8px 28px -6px rgba(36, 51, 40, 0.14)',
        float: '0 -8px 36px -8px rgba(36, 51, 40, 0.12)',
        btn: '0 6px 18px -4px rgba(47, 66, 51, 0.32)',
        community: '0 2px 12px rgba(41, 54, 41, 0.06)',
      },
      backgroundImage: {
        'forest-gradient': 'linear-gradient(135deg, #4A634E 0%, #5F7D62 50%, #8BA88E 100%)',
        'forest-deep': 'linear-gradient(175deg, #1A2B20 0%, #2F4233 50%, #8BA88E 100%)',
      },
    },
  },
  plugins: [],
};
