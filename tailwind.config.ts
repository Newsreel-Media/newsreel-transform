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
        "nr-gray": {
          100: "#f5f5f5",
          200: "#e5e5e5",
          400: "#999999",
          600: "#666666",
          800: "#1a1a1a",
          900: "#111111",
        },
      },
    },
  },
  plugins: [],
}

export default config
