import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        um: {
          bg: "#0d0a1a",
          surface: "rgba(255,255,255,0.05)",
          "surface-solid": "rgba(255,255,255,0.07)",
          "input-bg": "rgba(255,255,255,0.03)",
          border: "rgba(160,130,230,0.15)",
          primary: "#7C3AED",
          accent: "#06B6D4",
          "accent-warm": "#F59E0B",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B",
          text: "#f3efff",
          "text-secondary": "#b2a8cf",
          muted: "#8b82ad",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease both",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "orb-float": "orbFloat 18s ease-in-out infinite",
        "bar-grow": "barGrow 1.5s ease both",
        "node-appear": "nodeAppear 0.5s ease both",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "none" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(16,185,129,0)" },
        },
        orbFloat: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "25%": { transform: "translate(30px,-40px) scale(1.05)" },
          "50%": { transform: "translate(-20px,30px) scale(0.97)" },
          "75%": { transform: "translate(40px,20px) scale(1.03)" },
        },
        barGrow: {
          from: { width: "0" },
        },
        nodeAppear: {
          from: { opacity: "0", transform: "scale(0.85)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
