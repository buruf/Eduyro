/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#FDFAF4", dark: "#F5F0E8" },
        ink: { DEFAULT: "#1A1612", soft: "#2D2820" },
        gold: { DEFAULT: "#C8902A", light: "#F5E8C8", mid: "#E8C87A", dark: "#8A5E10" },
        brand: {
          blue: "#1B4F8A",
          "blue-light": "#E4EEF8",
          green: "#2D6A3F",
          "green-light": "#E3F2E8",
          red: "#C23B22",
          "red-light": "#FBE9E5",
        },
        border: { DEFAULT: "#E8E0D0", mid: "#D0C8B8" },
        muted: "#7A6E5F",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(26, 22, 18, 0.06)",
        elev: "0 8px 32px rgba(26, 22, 18, 0.08)",
      },
    },
  },
  plugins: [],
};
