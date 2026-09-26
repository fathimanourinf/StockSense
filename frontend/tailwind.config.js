export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf7f4",
          100: "#d6eee7",
          200: "#b3dfd3",
          300: "#83c8b6",
          400: "#54ad98",
          500: "#308f79",
          600: "#247864",
          700: "#1c6252",
          800: "#174e43",
          900: "#123d35",
        },
        accent: {
          50: "#fff4ed",
          100: "#ffe4d4",
          200: "#ffc6a4",
          500: "#e67b4e",
          600: "#cf6036",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
