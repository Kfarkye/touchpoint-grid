/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#f7f7f4",
          1: "#ffffff",
          2: "#f3f3ef",
          3: "#ebeae5",
          4: "#dcd9d1",
        },
        accent: {
          DEFAULT: "#4f6ef7",
          muted: "#4f6ef714",
          dim: "#3e57c8",
        },
        priority: {
          critical: "#cc4f3f",
          high: "#cc7f3f",
          medium: "#9f8a4d",
          standard: "#8a8f98",
          low: "#3e9a68",
        },
        text: {
          primary: "#1f2a37",
          secondary: "#5c6675",
          tertiary: "#8490a1",
        },
        border: {
          DEFAULT: "#dad8d2",
          hover: "#c6c3bc",
        },
        tone: {
          blue: "#4f7ed8",
          "blue-muted": "#4f7ed814",
          green: "#2f8f5f",
          "green-muted": "#2f8f5f14",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', '"SF Pro Display"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"DM Mono"', '"SF Mono"', '"Fira Code"', 'Menlo', 'monospace'],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "0.875rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
