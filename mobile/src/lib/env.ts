export const env = {
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:5000",
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  // Shop WhatsApp number in international form, e.g. "919876543210".
  // Leave unset to hide the Help row on the Account screen.
  shopWhatsapp: process.env.EXPO_PUBLIC_SHOP_WHATSAPP ?? "",
};
