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
          0: "#eef3f8",
          1: "#ffffff",
          2: "#f6f9fc",
          3: "#e5ecf4",
          4: "#cfd9e4",
        },
        accent: {
          DEFAULT: "#0f766e",
          muted: "#0f766e1a",
          dim: "#115e59",
        },
        priority: {
          critical: "#b91c1c",
          high: "#b45309",
          medium: "#a16207",
          standard: "#64748b",
          low: "#047857",
        },
        text: {
          primary: "#10253b",
          secondary: "#35516f",
          tertiary: "#6a8097",
        },
        border: {
          DEFAULT: "#d3deea",
          hover: "#b4c7d9",
        },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', '"JetBrains Mono"', 'Menlo', 'monospace'],
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
