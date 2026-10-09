import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { ink: "#17151f", violet: { 50: "#f7f5ff", 100: "#eee9ff", 500: "#7559f2", 600: "#6346e8", 700: "#5136ce" } },
      boxShadow: { card: "0 10px 30px rgba(41, 31, 72, 0.07)", glow: "0 16px 45px rgba(104, 75, 238, 0.24)" },
    },
  },
  plugins: [],
} satisfies Config;

