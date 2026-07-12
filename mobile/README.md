# Monster E-commerce — Mobile (React Native / Expo)

A React Native (Expo) port of the customer-facing storefront. It **reuses the
existing backend** in `../server` and mirrors the web client's data layer
(Zustand stores, axios API modules, types) while rebuilding the UI with React
Native primitives + [NativeWind](https://www.nativewind.dev/) (Tailwind for RN).

## What's included

Customer flows only (admin panel is intentionally excluded — data tables and
image upload are a poor fit for mobile):

- **Home** — banners, categories, coupons, new arrivals
- **Shop** — product grid with sort + category/size/color filters
- **Product details** — image gallery, color/size selection, add to cart, wishlist
- **Cart & checkout** — quantity controls, promo codes, address selection, points checkout
- **Wishlist**, **Orders** (with return), **Account** (profile + address CRUD)
- **Auth** — Clerk email/password sign-in & sign-up with email verification

## Prerequisites

- Node 20+ and npm
- The **Expo Go** app on a physical phone (iOS/Android), or an Android
  emulator / iOS simulator
- The backend running and reachable (deployed, or local on your LAN)

## Configure

Environment variables live in `.env` (already created):

```
EXPO_PUBLIC_BACKEND_URL=https://type-script-project-jtdk.vercel.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

- `EXPO_PUBLIC_BACKEND_URL` defaults to the **deployed** backend so the app
  works from a phone out of the box. To hit a **local** backend, use your
  machine's LAN IP (e.g. `http://192.168.1.5:5000`) — `localhost` / `127.0.0.1`
  will NOT resolve from a phone or emulator.
- The Clerk publishable key is the same Clerk project as the web client.

> ⚠️ If you point at a local backend, add the Expo dev origin to the server's
> `CORS_ORIGINS`. (Native requests don't send an `Origin` header, but the
> Metro/web preview does.)

## Run

```bash
cd mobile
npm install          # already done (uses .npmrc legacy-peer-deps for RN 0.86 / React 19)
npm run start        # then press 'a' (Android), 'i' (iOS), or scan the QR in Expo Go
```

The project has been validated with `npx tsc --noEmit` (clean) and
`npx expo export --platform android` (bundles successfully).

## Known limitations

| Area | Status | Notes |
|------|--------|-------|
| **Card payments (Razorpay)** | Disabled in Expo Go | `react-native-razorpay` is a **native module** and needs a custom dev build. The checkout button shows a clear message; use **"Pay with points"** to complete an order end-to-end in Expo Go. See `src/lib/razorpay.ts` for the 4-step enable guide. |
| Guest cart | In-memory + AsyncStorage | RN has no synchronous `localStorage`; the guest cart hydrates from AsyncStorage on launch and mirrors writes back. |
| Filters | Local state | Web used URL search params; mobile uses component state (same behaviour, no deep-linkable filters). |

## Enabling real card payments (dev build)

```bash
npm install react-native-razorpay
npx expo prebuild
npx expo run:android      # or run:ios (macOS)
```

Then implement `openRazorpayCheckout` in `src/lib/razorpay.ts` as documented in
that file. The rest of the checkout flow (session creation + confirmation) is
already wired.

## Project layout

```
src/
  lib/          # api, env, utils, toast, storage, token-cache, razorpay
  features/     # ported data layer: stores, api, types (auth + customer/*)
  components/   # ui/ primitives (Button, Badge, Card), ProductCard, Toaster
  navigation/   # RootNavigator (stack) + TabNavigator (bottom tabs)
  screens/      # Home, Shop, ProductDetails, Cart, Wishlist, Orders, Account, SignIn, SignUp
```
