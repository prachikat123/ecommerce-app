/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Design-system named colors (KrishiBazaar Agro-Modern System) ──
        surface: "#faf8ff",
        "surface-dim": "#d2d9f4",
        "surface-bright": "#faf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "surface-container-highest": "#dae2fd",
        "on-surface": "#131b2e",
        "on-surface-variant": "#3f493f",
        "inverse-surface": "#283044",
        "inverse-on-surface": "#eef0ff",
        outline: "#6f7a6e",
        "outline-variant": "#becabc",
        "surface-tint": "#006d30",
        primary: "#00652c",
        "on-primary": "#ffffff",
        "primary-container": "#15803d",
        "on-primary-container": "#d3ffd5",
        "inverse-primary": "#79db8d",
        secondary: "#006e2f",
        "on-secondary": "#ffffff",
        "secondary-container": "#6bff8f",
        "on-secondary-container": "#007432",
        tertiary: "#854600",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#a95b00",
        "on-tertiary-container": "#fff1e9",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#95f8a7",
        "primary-fixed-dim": "#79db8d",
        "on-primary-fixed": "#00210a",
        "on-primary-fixed-variant": "#005323",
        "secondary-fixed": "#6bff8f",
        "secondary-fixed-dim": "#4ae176",
        "on-secondary-fixed": "#002109",
        "on-secondary-fixed-variant": "#005321",
        "tertiary-fixed": "#ffdcc3",
        "tertiary-fixed-dim": "#ffb77d",
        "on-tertiary-fixed": "#2f1500",
        "on-tertiary-fixed-variant": "#6e3900",
        background: "#faf8ff",
        "on-background": "#131b2e",
        "surface-variant": "#dae2fd",

        // ── Brand accents from the design system prose ──
        forest: "#15803d",
        "forest-deep": "#166534",
        leaf: "#22c55e",
        harvest: "#d97706",
        "harvest-deep": "#b45309",
        slate: {
          deep: "#0f172a",
          mid: "#334155",
          soft: "#475569"
        }
      },
      fontFamily: {
        // Plus Jakarta Sans — headlines & pricing
        "headline-xl": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "headline-xl-mobile": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "headline-lg": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "headline-lg-mobile": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "headline-md": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "headline-sm": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "title-lg": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "price-hero": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        "price-card": ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        // Inter — body, labels, tabular data
        "title-md": ['"Inter"', "system-ui", "sans-serif"],
        "body-lg": ['"Inter"', "system-ui", "sans-serif"],
        "body-md": ['"Inter"', "system-ui", "sans-serif"],
        "body-sm": ['"Inter"', "system-ui", "sans-serif"],
        "label-md": ['"Inter"', "system-ui", "sans-serif"],
        "label-sm": ['"Inter"', "system-ui", "sans-serif"]
      },
      fontSize: {
        "headline-xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-xl-mobile": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "title-lg": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "22px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "price-hero": ["28px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "800" }],
        "price-card": ["20px", { lineHeight: "24px", fontWeight: "700" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "700" }]
      },
      spacing: {
        gutter: "1rem",
        "gutter-desktop": "1.5rem",
        margin: "1rem",
        "margin-tablet": "1.5rem",
        "margin-desktop": "2.5rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "0.75rem",
        "space-lg": "1rem",
        "space-xl": "1.5rem",
        "space-2xl": "2rem",
        "space-3xl": "3rem"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      maxWidth: {
        container: "1280px"
      },
      boxShadow: {
        level1: "0 2px 6px -1px rgba(22,101,52,0.04), 0 1px 4px -1px rgba(15,23,42,0.03)",
        level2: "0 10px 15px -3px rgba(22,101,52,0.08), 0 4px 6px -2px rgba(15,23,42,0.04)",
        level3: "0 20px 25px -5px rgba(15,23,42,0.10), 0 8px 10px -6px rgba(15,23,42,0.06)"
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } }
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        shimmer: "shimmer 1.6s infinite"
      }
    }
  },
  plugins: []
};
