/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0a66c2",
        "primary-dark": "#004182",
        "background-light": "#f3f2ef",
        "background-dark": "#1b1f23",
        "surface-light": "#ffffff",
        "surface-dark": "#24292e",
        "card-dark": "#293138",
        "accent-light": "#f1ece5",
        "accent-dark": "#2a2724",
        "text-main-light": "#191919",
        "text-main-dark": "#e1e4e8",
        "text-sub-light": "#666666",
        "text-sub-dark": "#8b949e",
        "border-light": "#e0e0e0",
        "border-dark": "#444c56",
        "accent-green": "#057642",
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
