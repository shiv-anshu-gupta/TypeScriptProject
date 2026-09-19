# StoreUpdatePrompt

The prompt for a new Play Store build.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/StoreUpdatePrompt.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`StoreUpdatePrompt`](#component-store-update-prompt) | React component | `function StoreUpdatePrompt(): Element \| null` | A dialog asking the customer to install a newer build from the Play Store, without a way out when their version is below the supported floor. |

## Exports in detail

### `StoreUpdatePrompt` {#component-store-update-prompt}

*React component*

A dialog asking the customer to install a newer build from the Play Store,
without a way out when their version is below the supported floor.

```ts
function StoreUpdatePrompt(): Element | null
```

Takes no props.

**Returns** `Element \| null`

Prompts the customer to install a NEW PLAY STORE BUILD (a native release),
which an OTA update can never deliver. UpdatePrompt handles OTA; this one
handles "we published a new release in Play Console".

How it knows the installed version: app.json sets
`runtimeVersion.policy = "appVersion"`, so `Updates.runtimeVersion` IS the
installed binary's version ("1.0.0") — it is baked into the native build and
does NOT change when an OTA is applied. That makes this whole feature
shippable over OTA, with no native module to add.

Android only; no iOS build is published yet. It calls `GET /app-version`
directly rather than through a feature module, on mount and on every return
to the foreground. Anything that stops it from getting a sensible answer —
offline, the endpoint unconfigured, a dev build with no runtime version —
leaves it silent rather than guessing.

Below the server's `minVersion` the update is mandatory and "Later"
disappears. Otherwise "Later" holds until the app is restarted.

Mounted once at the app root and takes no props.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/StoreUpdatePrompt.tsx#L84)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/StoreUpdatePrompt.tsx)
