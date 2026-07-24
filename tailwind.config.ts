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
        bg: {
          0: "#030712",
          1: "#0f172a",
          2: "#111827",
        },
        accent: "#10b981",
        danger: "#ef4444",
        "text-1": "#f8fafc",
        "text-2": "#94a3b8",
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.30)",
      },
    },
  },
  plugins: [],
};

export default config;
