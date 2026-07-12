/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#0a0a0a",
        card: "#ffffff",
        "card-foreground": "#0a0a0a",
        primary: "#18181b",
        "primary-foreground": "#fafafa",
        secondary: "#f4f4f5",
        "secondary-foreground": "#18181b",
        muted: "#f4f4f5",
        "muted-foreground": "#71717a",
        accent: "#f4f4f5",
        border: "#e4e4e7",
        input: "#e4e4e7",
        destructive: "#dc2626",
        "destructive-foreground": "#fafafa",
        success: "#16a34a",
      },
    },
  },
  plugins: [],
};
