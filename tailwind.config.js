/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          terracotta: "#C2410C",
          forest: "#047857",
          gold: "#D97706",
          cream: "#FDF6EC",
          charcoal: "#2B211B",
        },
      },
      boxShadow: {
        soft: "0 10px 20px rgba(43, 33, 27, 0.12)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #C2410C, #047857)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
