/** @type {import('tailwindcss').Config} */
// sKirana theme — "Ocean Gray on Warm Sand".
// A calm, trustworthy ocean-gray primary on a warm sand ground, with crisp
// white cards that lift off it. The warm ground makes food photos look
// appetising and keeps the app feeling inviting rather than clinical, while the
// cool ocean primary provides a confident, premium contrast.
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#f6f1e8", // warm sand ground
        foreground: "#1f2a2e", // deep ocean ink (never pure black)
        card: "#ffffff",
        "card-foreground": "#1f2a2e",
        primary: "#3c5a64", // ocean gray
        "primary-foreground": "#ffffff",
        secondary: "#efe7d8", // warm sand tint — chips, icon bubbles, badges
        "secondary-foreground": "#1f2a2e",
        muted: "#f1ebe0",
        "muted-foreground": "#6f6857", // warm gray
        accent: "#dde8e7", // soft ocean-sage — a fresh highlight
        border: "#e6dcc9", // warm border
        input: "#e6dcc9",
        destructive: "#c0492f", // warm terracotta-red (harmonises with sand)
        "destructive-foreground": "#ffffff",
        success: "#4f7a4d", // muted sage-green (fits the warm palette)
      },
    },
  },
  plugins: [],
};
