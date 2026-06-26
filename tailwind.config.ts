const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#5A1F2B",
          "primary-dark": "#3F1620",
          background: "#F7F2EA",
          "background-secondary": "#D8C4AE",
          surface: "#FBF8F2",
          "surface-muted": "#EFE5D8",
          text: "#5B3A2E",
          strong: "#1E1A18",
          success: "#6D9B73",
          warning: "#C9A227",
          danger: "#A13D3D",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      boxShadow: {
        premium: "0 18px 55px rgba(63, 22, 32, 0.08)",
        card: "0 14px 35px rgba(90, 31, 43, 0.06)",
      },
    },
  },
};

export default config;
