/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#06053a",
        secondary: "#edeafb",
      },
      spacing: {
        section: "6rem",
        "section-sm": "3rem",
      },
      fontSize: {
        "3xl": "2rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem",
        "7xl": "4.5rem",
      },
      lineHeight: {
        tight: "1.2",
        snug: "1.375",
        normal: "1.5",
        relaxed: "1.625",
        loose: "2",
      },
    },
  },
  plugins: [],
};
