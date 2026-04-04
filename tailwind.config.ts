import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary: deep crimson ──
        "primary":           "#930500",
        "primary-fixed":     "#ff5252",   // light red — use for text/icons on dark surfaces
        "primary-dim":       "#7d0000",
        "primary-container": "#3d0000",
        "on-primary":        "#ffffff",
        "on-primary-container": "#ffdad6",

        // ── Secondary: calm blue ──
        "secondary":           "#95BBEA",
        "secondary-container": "#1e3a57",
        "secondary-dim":       "#6a9dd4",
        "on-secondary":        "#0d1f30",
        "on-secondary-container": "#cce0ff",

        // ── Tertiary: warm cream ──
        "tertiary":           "#FFF8E7",
        "tertiary-dim":       "#e8dcc8",
        "tertiary-container": "#4a3500",
        "on-tertiary":        "#2a1f0d",
        "on-tertiary-container": "#ffefc8",

        // ── Surfaces ──
        "background":               "#121212",
        "surface":                  "#121212",
        "surface-container-lowest": "#0a0a0a",
        "surface-container-low":    "#161616",
        "surface-container":        "#1e1e1e",
        "surface-container-high":   "#242424",
        "surface-container-highest":"#2e2e2e",
        "surface-bright":           "#303030",
        "surface-dim":              "#0a0a0a",
        "surface-variant":          "#242424",
        "inverse-surface":          "#e6e1e5",
        "inverse-on-surface":       "#1c1b1f",

        // ── On-surface ──
        "on-surface":         "#e6e1e5",
        "on-surface-variant": "#9e9e9e",
        "outline":            "#6b6b6b",
        "outline-variant":    "#404040",

        // ── Error ──
        "error":           "#ffb4ab",
        "error-container": "#93000a",
        "on-error":        "#690005",
        "on-error-container": "#ffdad6",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md:      "0.75rem",
        lg:      "1rem",
        xl:      "1.5rem",
        "2xl":   "1rem",   // moderate roundedness (level 2)
        "3xl":   "1.25rem",
        full:    "9999px",
      },
      fontFamily: {
        headline: ["Noto Serif",     "serif"],
        body:     ["Public Sans",    "sans-serif"],
        label:    ["Manrope",        "sans-serif"],
        editorial:["Instrument Serif","serif"],
        display:  ["Inter",          "sans-serif"],
      },
      spacing: {
        // level-2 spacing: standard 4px base, normal density
        "0.5": "0.125rem",
        "1":   "0.25rem",
        "2":   "0.5rem",
        "3":   "0.75rem",
        "4":   "1rem",
        "5":   "1.25rem",
        "6":   "1.5rem",
        "8":   "2rem",
        "10":  "2.5rem",
        "12":  "3rem",
        "16":  "4rem",
        "20":  "5rem",
        "24":  "6rem",
      },
      scale: { "102": "1.02" },
      animation: {
        "fade-in":  "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(12px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
