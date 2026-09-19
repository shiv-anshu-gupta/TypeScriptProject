# sKirana — mobile app

The customer's app: write a grocery list (or photograph a handwritten one), send
it to the shop, see the price the shop sends back, and collect the order.

Full developer reference: **[../docs/MOBILE-APP.md](../docs/MOBILE-APP.md)** —
screens, stores, components, auth, release and the traps worth knowing.
System overview and the production runbook: **[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)**.

## Stack

Expo SDK 54 · React Native 0.81 · New Architecture · NativeWind · zustand ·
Clerk (Google + email code) · i18next (English + Hindi) · expo-updates (OTA).

## Run it

```bash
npm install
npx expo start          # then open in a development build
```

A **development build** is required — this app uses native modules Expo Go does
not carry (Clerk, notifications, image picker):

```bash
eas build --platform android --profile development
```

## Configure

`.env` holds only public values and is committed:

```
EXPO_PUBLIC_BACKEND_URL=...        # the deployed API
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

To point at a server on your own machine, use your LAN IP
(`http://192.168.x.x:5000`) — `localhost` does not resolve from a phone — and add
that origin to the server's `CORS_ORIGINS`.

> **Test keys go in `.env.development.local`, never `.env.local`.** Expo reads
> `.env.local` for production bundles too, so a test key there would ship to
> customers. `npm run ota` refuses to publish unless the key resolves to
> `pk_live_`.

## Release

| What changed | How it ships |
|---|---|
| JavaScript, styles, strings, images | `npm run ota` — reaches installs of the same app version, applies on the **second** launch |
| A permission, a native module, the SDK, the version | `eas build --platform android --profile production`, then upload the `.aab` to Play |

`runtimeVersion` follows `version` in `app.json`, so an OTA only reaches builds
of that same version.

## Layout

```
src/
  screens/      one file per screen
  components/   shared UI; components/ui/ is the design system
  features/     one folder per domain: store.ts, api.ts, types.ts
  navigation/   tabs and stack
  lib/          api client, i18n, toast, helpers
```
