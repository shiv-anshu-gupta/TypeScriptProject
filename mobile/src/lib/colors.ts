// Single source of truth for colors referenced from JS (icon `color=` props,
// ActivityIndicator, placeholderTextColor) — mirrors the Tailwind tokens in
// tailwind.config.js. Keep the two in sync.
//
// Theme: "Ocean Gray on Warm Sand".
export const colors = {
  background: "#f6f1e8", // warm sand ground
  foreground: "#1f2a2e", // deep ocean ink
  card: "#ffffff",
  primary: "#3c5a64", // ocean gray
  primaryForeground: "#ffffff",
  secondary: "#efe7d8", // warm sand tint
  muted: "#f1ebe0",
  mutedForeground: "#6f6857", // warm gray
  placeholder: "#ada291", // input placeholders / empty-state icons
  accent: "#dde8e7", // soft ocean-sage highlight
  border: "#e6dcc9", // warm border
  destructive: "#c0492f", // warm terracotta-red
  success: "#4f7a4d", // muted sage-green
  // Signature "list paper" — the handwritten grocery pad on Home.
  paper: "#fdf8ea",
} as const;
