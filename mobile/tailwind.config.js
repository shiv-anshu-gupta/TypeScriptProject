/** @type {import('tailwindcss').Config} */
// sKirana theme — "Ocean Gray on Cool Mist".
// A calm, trustworthy ocean-gray primary on a soft cool-mist ground, with
// white cards that gently lift off it. The warm cream "list paper" (see
// GroceryList) is kept as a deliberate warm accent against the cool palette —
// that warm/cool tension is what keeps the app feeling fresh, not clinical.
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#eaf0f2", // cool mist ground
        foreground: "#1d2a2f", // ocean ink (never pure black)
        card: "#ffffff",
        "card-foreground": "#1d2a2f",
        primary: "#3c5a64", // ocean gray
        "primary-foreground": "#ffffff",
        secondary: "#dbe6ea", // soft ocean tint — chips, icon bubbles, badges
        "secondary-foreground": "#1d2a2f",
        muted: "#e6edef",
        "muted-foreground": "#5c6e74",
        accent: "#d3e1e4",
        border: "#d6e0e2",
        input: "#d6e0e2",
        destructive: "#dc2626",
        "destructive-foreground": "#ffffff",
        success: "#16a34a",
      },
    },
  },
  plugins: [],
};
