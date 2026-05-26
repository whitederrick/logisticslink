import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        harbor: "#0F766E",
        signal: "#EAB308",
        deck: "#F6F8FB"
      }
    }
  },
  plugins: []
};

export default config;
