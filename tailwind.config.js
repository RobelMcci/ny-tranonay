/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#DC2626",
          green: "#10B981",
          dark: "#1F2937",
        },
      },
      boxShadow: {
        soft: "0 10px 20px rgba(0,0,0,0.15)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #DC2626, #10B981)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
