/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF7FF",
          100: "#D9ECFF",
          200: "#B4D8FF",
          300: "#82BDFF",
          400: "#4A9CF5",
          500: "#1E7BE6",
          600: "#0B6BCB",
          700: "#0956A4",
          800: "#0B4783",
          900: "#0E3D6E",
          950: "#082649",
        },
        aqua: {
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontFeatureSettings: {
        tabular: '"tnum"',
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        pop: "0 4px 16px -4px rgb(15 23 42 / 0.08), 0 8px 24px -8px rgb(15 23 42 / 0.10)",
        glow: "0 0 0 4px rgb(11 107 203 / 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 240ms cubic-bezier(.2,.8,.2,1)",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
      },
    },
  },
  plugins: [],
};
