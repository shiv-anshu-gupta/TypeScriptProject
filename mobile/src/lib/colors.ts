// Single source of truth for colors referenced from JS (icon `color=` props,
// ActivityIndicator, placeholderTextColor) — mirrors the Tailwind tokens in
// tailwind.config.js. Keep the two in sync.
//
// Theme: "Ocean Gray on Cool Mist".
export const colors = {
  background: "#eaf0f2", // cool mist ground
  foreground: "#1d2a2f", // ocean ink
  card: "#ffffff",
  primary: "#3c5a64", // ocean gray
  primaryForeground: "#ffffff",
  secondary: "#dbe6ea",
  muted: "#e6edef",
  mutedForeground: "#5c6e74",
  placeholder: "#94a6ac", // input placeholders / empty-state icons
  accent: "#d3e1e4",
  border: "#d6e0e2",
  destructive: "#dc2626",
  success: "#16a34a",
  // Signature warm "list paper" — deliberate warm accent on the cool palette.
  paper: "#fdf8ea",
} as const;
