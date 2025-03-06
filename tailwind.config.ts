import type { Config } from "tailwindcss";
import { colors } from "./styles/theme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Set the Tailwind colors based on our theme
        purple: colors.primary,
        orange: colors.secondary,
        
        // Map our primary/secondary colors to Tailwind's naming convention
        primary: colors.primary,
        secondary: colors.secondary,
        
        // Keep the neutral colors
        neutral: colors.neutral,
        
        // Alert colors
        error: colors.error,
        warning: colors.warning,
        success: colors.success,
        info: colors.info,
        
        // Base colors for background/foreground
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
