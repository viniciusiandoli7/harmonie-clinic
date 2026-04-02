// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        harmonie: {
          noir: "#1A1A1A",   // Noir Absolu
          gold: "#C5A059",   // Or Harmonie
          blanc: "#FAFAFA",  // Blanc Pur
          gray: "#94A3B8",   // Para textos secundários delicados
        }
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'none': '0px', // Forçar bordas retas em tudo
      }
    },
  },
};