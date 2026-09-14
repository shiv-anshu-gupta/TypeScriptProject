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
    appearance={clerkAppearance}
  >
    <App />
    <Toaster />
  </ClerkProvider>,
);
