/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../packages/shared/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // Brand colors - Primary
        brand: {
          yellow: '#FFD06D',
          pink: '#EF8EA2',
          teal: '#2FCCC0',
          blue: '#0890F1',
          // Brand colors - Shades
          shadeBlue: '#202B93',
          shadeTeal: '#04B4A8',
          shadePink: '#ED738C',
          shadeYellow: '#FFB55D',
          // Brand colors - Lights
          lightBlue: '#BAEBFF',
          lightTeal: '#93ECE5',
          lightPink: '#FBB4C2',
          lightYellow: '#FFE5AE',
        },
        // Legacy support (keeping for backward compatibility)
        laundryheap: {
          yellow: '#FFD06D',
          blue: '#0890F1',
          lightRed: '#FBB4C2',
          Red: '#ED738C',
          brandYellow: '#FFD06D',
          brandPink: '#EF8EA2',
          brandTeal: '#2FCCC0',
          brandBlue: '#0890F1',
          shadeBlue: '#202B93',
          shadeTeal: '#04B4A8',
          shadePink: '#ED738C',
          shadeYellow: '#FFB55D',
          lightBlue: '#BAEBFF',
          lightTeal: '#93ECE5',
          lightPink: '#FBB4C2',
          lightYellow: '#FFE5AE',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 