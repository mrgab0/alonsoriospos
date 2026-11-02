/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          ethereal: '#E6F7F0',
          soft: '#B9E6D3',
          muted: '#76C7B2',
          glow: 'rgba(94, 234, 212, 0.22)',
        },
        teal: {
          floral: '#5EEAD4',
          luminous: '#2DD4BF',
          accent: '#14B8A6',
          deep: '#0F766E',
        },
        primary: {
          DEFAULT: '#2a0002',
          burgundy: '#8B0024',
          modern: '#D81B60',
          dark: '#1a0001',
          light: '#fff0ef',
        },
        secondary: {
          DEFAULT: '#745b0f',
          gold: '#D4AF37',
          light: '#ffdf92',
        },
        surface: {
          DEFAULT: '#fff8f7',
          container: '#faeae9',
          high: '#f5e5e3',
        },
        carbon: '#221a19',
        brand: {
          magenta: '#E6007F',
          green: '#92C21E',
          DEFAULT: '#E6007F',
        },
      },
      fontFamily: {
        brand: ['var(--font-playfair)', 'Didot', 'Bodoni MT', 'Cinzel', 'Playfair Display', 'serif'],
        sans: ['var(--font-montserrat)', 'var(--font-plus-jakarta)', 'Montserrat', 'Plus Jakarta Sans', 'sans-serif'],
        serif: ['var(--font-playfair)', 'var(--font-manrope)', 'Playfair Display', 'Manrope', 'serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        body: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0px 4px 20px rgba(42,0,2,0.06)',
        'premium-hover': '0px 12px 30px rgba(42,0,2,0.12)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
