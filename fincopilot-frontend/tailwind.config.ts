import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#060610",
          1: "#0b0c1a",
          2: "#0f1024",
          3: "#13152e",
          4: "#1d1f33",
          5: "#252741",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.07)",
          subtle: "rgba(255,255,255,0.04)",
          bright: "rgba(255,255,255,0.12)",
        },
        brand: {
          50: "#f0edff",
          100: "#e0d9ff",
          200: "#c2b3ff",
          300: "#a48dff",
          400: "#8b6fff",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b1678",
          950: "#2e1065",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
        },
        rose: {
          400: "#fb7185",
          500: "#f43f5e",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        sky: {
          400: "#38bdf8",
          500: "#0ea5e9",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.08) 100%)",
        "hero-gradient": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.3), transparent)",
        "glow-radial": "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
        "emerald-gradient": "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        "rose-gradient": "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)",
        "amber-gradient": "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
        "sky-gradient": "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
        "mesh-gradient": "radial-gradient(at 40% 20%, rgba(124,58,237,0.2) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(79,70,229,0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(14,165,233,0.1) 0px, transparent 50%)",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-hover": "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glow-sm": "0 0 12px rgba(124,58,237,0.35)",
        glow: "0 0 24px rgba(124,58,237,0.4)",
        "glow-lg": "0 0 48px rgba(124,58,237,0.45)",
        "glow-emerald": "0 0 24px rgba(16,185,129,0.4)",
        "glow-rose": "0 0 24px rgba(244,63,94,0.4)",
        "glow-amber": "0 0 24px rgba(251,191,36,0.4)",
        "inner-glow": "inset 0 0 20px rgba(124,58,237,0.1)",
        "card": "0 1px 3px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.6), 0 16px 48px rgba(0,0,0,0.4)",
      },
      fontFamily: {
        sans: ["Inter var", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.35s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        blob: "blob 10s infinite",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-50px) scale(1.1)" },
          "66%": { transform: "translate(-20px,20px) scale(0.9)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
