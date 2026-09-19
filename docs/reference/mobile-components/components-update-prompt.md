# UpdatePrompt

The prompt for an over-the-air JavaScript update.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/UpdatePrompt.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`UpdatePrompt`](#component-update-prompt) | React component | `function UpdatePrompt(): Element \| null` | A dialog offering to restart the app into a newly downloaded update, with a "Later" the customer can always take. |

## Exports in detail

### `UpdatePrompt` {#component-update-prompt}

*React component*

A dialog offering to restart the app into a newly downloaded update, with a
"Later" the customer can always take.

```ts
function UpdatePrompt(): Element | null
```

Takes no props.

**Returns** `Element \| null`

Shows a friendly "a new version is ready" prompt whenever an OTA update has
been downloaded, and lets the customer apply it immediately (reload) instead
of waiting for the next natural app restart.

expo-updates already downloads a new update on launch (checkAutomatically:
ON_LOAD). `isUpdatePending` becomes true once it's downloaded; we also
re-check whenever the app returns to the foreground so a freshly-published
update is picked up without a full cold start. No-op in Expo Go / dev
(Updates.isEnabled is false there).

"Later" is remembered only for that one update. A different update arriving
afterwards asks again, which is why the dismissal is keyed on the pending
update's id rather than a plain boolean.

Mounted once at the app root and takes no props. This is the JavaScript
half of updating; `StoreUpdatePrompt` handles a new native release.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/UpdatePrompt.tsx#L36)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/UpdatePrompt.tsx)
