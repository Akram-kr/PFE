/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // <--- Make sure this matches your folder!
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          1: "#111118",
          2: "#16161f",
          3: "#1c1c28",
        },
        surface: {
          DEFAULT: "#1f1f2e",
          2: "#252538",
        },
        accent: {
          DEFAULT: "#7c6df0",
          2: "#9d91f5",
          glow: "rgba(124,109,240,0.25)",
        },
        teal: {
          vault: "#2dd4bf",
          dim: "rgba(45,212,191,0.12)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.07)",
          2: "rgba(255,255,255,0.12)",
        },
        text: {
          1: "#f0effe",
          2: "#a09ec0",
          3: "#6b698a",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        xl: "24px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease both",
        "fade-in": "fadeIn 0.3s ease both",
        float: "float 4s ease-in-out infinite",
        "border-pulse": "borderPulse 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
