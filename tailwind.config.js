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
          0: "#f5f7fb",
          1: "#ffffff",
          2: "#f8fafc",
          3: "#eef2ff",
          4: "#dbe5ff",
        },
        accent: {
          DEFAULT: "#2b57f5",
          muted: "#2b57f514",
          dim: "#1d3fbf",
        },
        priority: {
          critical: "#dc2626",
          high: "#f97316",
          medium: "#ca8a04",
          standard: "#64748b",
          low: "#16a34a",
        },
        text: {
          primary: "#0f172a",
          secondary: "#334155",
          tertiary: "#64748b",
        },
        border: {
          DEFAULT: "#e2e8f0",
          hover: "#cbd5e1",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-body)",
          '"Avenir Next"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
        serif: ["var(--font-headline)", "ui-serif", "serif"],
        mono: ["var(--font-mono)", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "0.875rem" }],
      },
    },
  },
  plugins: [],
};
