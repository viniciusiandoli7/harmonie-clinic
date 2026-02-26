const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hcBlack: "#1A1A1A",
        hcGold: "#C5A059",
        hcOffWhite: "#FAF8F4",
        hcBorder: "#E5E7EB",
        hcGray: "#6B7280",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      letterSpacing: {
        widestPlus: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;
