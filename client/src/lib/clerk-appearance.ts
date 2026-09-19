/**
 * The sKirana theme applied to every Clerk screen.
 *
 * @packageDocumentation
 */
// sKirana branding for every Clerk screen in the admin panel (sign-in,
// sign-up, the account menu). Set in code rather than the Clerk dashboard so
// the development and production instances always look the same.
//
// Current Clerk: layout settings live under `options` (formerly `layout`),
// and the colour names are colorForeground / colorMutedForeground / colorInput
// (formerly colorText / colorTextSecondary / colorInputBackground).
/**
 * Appearance object passed to `ClerkProvider` in `main.tsx`.
 *
 * @remarks
 * It styles the sign-in and sign-up forms and the `UserButton` account menu in
 * the admin header. Keeping it in code, rather than in the Clerk dashboard,
 * means the development and production Clerk instances cannot drift apart.
 *
 * Three details that are easy to undo by accident, each recorded in the inline
 * comments below and worth preserving:
 *
 * - Clerk's current API puts layout settings under `options`, not `layout`, and
 *   renamed several colour variables. Older examples found online will not
 *   apply cleanly.
 * - The admin theme sets `--radius` to 0, so Tailwind's `rounded-*` utilities
 *   are square here. Every radius in `elements` is an explicit pixel value for
 *   that reason.
 * - Two `elements` overrides exist to fix real visibility problems: the social
 *   button label was white on white, and Clerk's default hairline borders were
 *   nearly invisible on the cream background.
 *
 * `privacyPageUrl` and `termsPageUrl` point at this app's own public legal
 * routes, which is part of why those routes must stay unguarded.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#3c5a64",
    colorPrimaryForeground: "#ffffff",
    colorForeground: "#1f2a2e",
    colorMutedForeground: "#5d6a6e",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#1f2a2e",
    colorBorder: "#cbbfa9",
    colorRing: "#3c5a64",
    colorDanger: "#c0392b",
    fontFamily: '"Inter Variable", system-ui, sans-serif',
    borderRadius: "0.75rem",
  },
  options: {
    logoImageUrl: "/skirana-logo.png",
    logoLinkUrl: "/",
    logoPlacement: "inside",
    socialButtonsVariant: "blockButton",
    socialButtonsPlacement: "top",
    privacyPageUrl: "/privacy",
    termsPageUrl: "/terms",
  },
  // The admin theme sets --radius to 0, so Tailwind's rounded-* sizes are all
  // square here - radii below are explicit pixel values.
  elements: {
    cardBox:
      "rounded-[20px] border border-[#e3dccf] shadow-[0_18px_40px_-12px_rgba(31,42,46,0.18)]",
    logoImage: "rounded-[12px]",
    // Clerk draws this label in the primary-foreground colour (white) on a
    // white outline button, so it vanished - pin it to the text colour.
    socialButtonsBlockButtonText: "text-[#1f2a2e]! font-semibold",
    // Clerk's default hairline outlines almost disappear on white; a visible
    // border tells a first-time user where to tap and type.
    socialButtonsBlockButton: "border! border-[#d6ccb8]!",
    formFieldInput: "border! border-[#d6ccb8]!",
  },
};
