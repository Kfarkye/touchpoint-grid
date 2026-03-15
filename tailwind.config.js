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
          0: "#f6f3ee",
          1: "#fffdf9",
          2: "#f4eee4",
          3: "#e8dccd",
          4: "#d8c6b2",
        },
        accent: {
          DEFAULT: "#1f6a5b",
          muted: "#1f6a5b1a",
          dim: "#174f45",
        },
        priority: {
          critical: "#b91c1c",
          high: "#b45309",
          medium: "#a16207",
          standard: "#64748b",
          low: "#047857",
        },
        text: {
          primary: "#2d2a26",
          secondary: "#5b5247",
          tertiary: "#867a6b",
        },
        border: {
          DEFAULT: "#dfd3c4",
          hover: "#c9b9a7",
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
