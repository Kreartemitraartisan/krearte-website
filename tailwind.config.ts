import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        krearte: {
          black: "#0a0a0a",
          charcoal: "#1a1a1a",
          gray: {
            50: "#fafafa",
            100: "#f5f5f5",
            200: "#e5e5e5",
            300: "#d4d4d4",
            400: "#a3a3a3",
            500: "#737373",
            600: "#525252",
            700: "#404040",
            800: "#262626",
            900: "#171717",
          },
          white: "#ffffff",
          cream: "#f9f7f4",
          sand: "#e8e4df",
          // 🎨 NEW ACCENT COLOR (Teal/Cyan)
          teal: "#00667d",
          tealLight: "#008ba3",
          tealDark: "#004d5f",
        },
        accent: {
          gold: "#c9a962",
          bronze: "#cd7f32",
          muted: "#9a8c7a",
          teal: "#00667d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      maxWidth: {
        content: "1440px",
        narrow: "800px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0, 0, 0, 0.06)",
        medium: "0 8px 32px rgba(0, 0, 0, 0.08)",
        elevated: "0 16px 48px rgba(0, 0, 0, 0.12)",
      },
      // 🎨 ELEGANT GRADIENTS
      backgroundImage: {
        "gradient-subtle": "linear-gradient(135deg, #f9f7f4 0%, #f0ede8 100%)",
        "gradient-teal-subtle": "linear-gradient(135deg, rgba(0, 102, 125, 0.05) 0%, rgba(0, 102, 125, 0.02) 100%)",
        "gradient-teal-soft": "linear-gradient(135deg, #00667d 0%, #008ba3 100%)",
        "gradient-luxury": "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #00667d 100%)",
        "gradient-hero": "linear-gradient(180deg, #f9f7f4 0%, #f0f4f5 100%)",
      },
      // 🎨 GRADIENT ANGLES
      gradientColorStops: {
        "teal-subtle-start": "rgba(0, 102, 125, 0.08)",
        "teal-subtle-end": "rgba(0, 102, 125, 0)",
      },
    },
  },
};

export default config;