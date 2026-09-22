/**
 * Browser entry point for the sKirana admin single-page app.
 *
 * @remarks
 * This module is the script referenced by `client/app.html`, which is the SPA
 * shell. The other HTML entry, `client/index.html`, is a hand-written
 * zero-JavaScript marketing homepage and never loads this file.
 *
 * It mounts three things around the app, in this order:
 *
 * - `ClerkProvider` — authentication, deliberately outside the router so a
 *   Clerk session survives every navigation.
 * - `App` — which boots the auth store and renders the router.
 * - `Toaster` — the sonner toast host. Every `toast(...)` call anywhere in the
 *   app depends on this being mounted.
 *
 * `VITE_CLERK_PUBLISHABLE_KEY` is read here. Vite substitutes
 * `import.meta.env.VITE_*` textually at build time, so the key becomes a
 * string literal in the bundle. Changing it in Vercel has no effect until the
 * client project is redeployed.
 *
 * @see {@link ../lib/clerk-appearance | clerkAppearance} for why the Clerk
 * theme is set in code rather than in the Clerk dashboard.
 *
 * @packageDocumentation
 */
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/react";
import { Toaster } from "./components/ui/sonner.tsx";
import { clerkAppearance } from "./lib/clerk-appearance";

createRoot(document.getElementById("root")!).render(
  // "/" is the public homepage (a separate static page), so signing out lands
  // on the admin sign-in instead.
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!}
    afterSignOutUrl="/sign-in"
    // Clerk's own default after signing in is "/", and it gets there with a
    // full page load rather than a router navigation. In production Vercel
    // checks the filesystem before its rewrites, so "/" serves the static
    // marketing homepage and the person who just signed in lands on a page
    // with no panel on it. Both roles belong at /admin, which redirects on to
    // the lists. "Fallback" means an explicit ?redirect_url still wins, so a
    // deep link into the panel survives the sign-in.
    signInFallbackRedirectUrl="/admin"
    signUpFallbackRedirectUrl="/admin"
    appearance={clerkAppearance}
  >
    <App />
    <Toaster />
  </ClerkProvider>,
);
