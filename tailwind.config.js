/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(12px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "ripple": {
          "0%": { transform: "scale(0)", opacity: "0.45" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "bounce-click": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(0.92)" },
          "80%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "ripple": "ripple 0.55s ease-out forwards",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "bounce-click": "bounce-click 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
