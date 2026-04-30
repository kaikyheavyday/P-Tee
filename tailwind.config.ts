import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        line: "#06C755",
        "line-dark": "#05A647",
      },
    },
  },
  plugins: [],
};

export default config;
