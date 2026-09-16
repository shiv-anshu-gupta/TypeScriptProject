// Refuses to publish a production OTA that carries the TEST login key.
//
// Expo reads .env.local BEFORE .env even for a production bundle, so a test
// key left on the publishing machine would reach every customer (it already
// happened once). This resolves the env exactly as `expo export` will, and
// stops the publish if the key is not the live one.
const path = require("path");

process.env.NODE_ENV = "production";
require("@expo/env").load(path.resolve(__dirname, ".."));

const KEY = "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY";
const value = process.env[KEY] || "";

if (!value.startsWith("pk_live_")) {
  console.error(
    [
      "",
      `  Refusing to publish: ${KEY} is not a live key.`,
      `  Resolved to: ${value ? value.slice(0, 12) + "..." : "(empty)"}`,
      "",
      "  A .env.local / .env.production.local on this machine overrides .env.",
      "  Use .env.development.local for test keys - it is ignored in a",
      "  production bundle - then run the publish again.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(`${KEY} is live (${value.slice(0, 16)}...) - publishing.`);
