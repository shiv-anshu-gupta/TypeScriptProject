# env

The build-time configuration the app reads, with its defaults.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/env.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 1 |

## Description

Only `EXPO_PUBLIC_*` variables reach the bundle, and they are baked in at
export time — nothing here can change on a running phone. Values come from
the env files in `mobile/`, and Expo reads `.env.local` **before** `.env`
even for a production bundle, which is why publishing goes through
`npm run ota` and its preflight guard rather than `eas update` directly.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`env`](#constant-env) | Constant | `const env: { backendUrl: any; clerkPublishableKey: any; shopWhatsapp: any }` | Backend base URL, Clerk key and the optional shop WhatsApp number. |

## Exports in detail

### `env` {#constant-env}

*Constant*

Backend base URL, Clerk key and the optional shop WhatsApp number.

```ts
const env: { backendUrl: any; clerkPublishableKey: any; shopWhatsapp: any }
```

`backendUrl` falls back to `http://localhost:5000`, which is a development
convenience: a release built without `EXPO_PUBLIC_BACKEND_URL` will start
and then fail every request rather than refusing to start.

`clerkPublishableKey` falls back to `""`, which Clerk rejects at startup.
A production bundle must carry a `pk_live_` key; the preflight script
checks that before an over-the-air publish.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/env.ts#L26)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/env.ts)
