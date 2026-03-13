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
          0: "#09090b",
          1: "#0f0f12",
          2: "#16161a",
          3: "#1e1e23",
          4: "#27272d",
        },
        accent: {
          DEFAULT: "#22d3ee",
          muted: "#22d3ee20",
          dim: "#0e7490",
        },
        priority: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          standard: "#6b7280",
          low: "#22c55e",
        },
        text: {
          primary: "#f4f4f5",
          secondary: "#a1a1aa",
          tertiary: "#71717a",
        },
        border: {
          DEFAULT: "#27272a",
          hover: "#3f3f46",
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
