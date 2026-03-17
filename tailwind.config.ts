import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-bree-serif)", "Georgia", "serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      colors: {
        "nr-red": "#FF6343",
        "nr-yellow": "#EDBD1F",
        "nr-dark": "#000000",
        // Official Newsreel neutral scale
        "nr-black": "#000000",
        "nr-charcoal": "#0F0F0F",
        "nr-lead": "#1F1F1F",
        "nr-iron": "#3A3A3A",
        "nr-steel": "#6B6B6B",
        "nr-ash": "#898989",
        "nr-silver": "#ADADAD",
        "nr-smoke": "#C8C8C8",
        "nr-paper": "#F0F0F0",
        // Legacy aliases (keep for backward compat)
        "nr-gray": {
          100: "#F0F0F0",
          200: "#C8C8C8",
          400: "#898989",
          600: "#6B6B6B",
          800: "#1F1F1F",
          900: "#0F0F0F",
        },
      },
    },
  },
  plugins: [],
}

export default config
