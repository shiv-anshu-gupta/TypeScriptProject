# useWarmUpBrowser `use-warm-up-browser`

A head start for the in-app browser the OAuth login opens.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/use-warm-up-browser.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useWarmUpBrowser`](#hook-use-warm-up-browser) | Hook | `function useWarmUpBrowser(): void` | Warming up the browser on Android makes the OAuth sheet open noticeably faster; it's a no-op on iOS. |

## Exports in detail

### `useWarmUpBrowser` {#hook-use-warm-up-browser}

*Hook*

Warming up the browser on Android makes the OAuth sheet open noticeably
faster; it's a no-op on iOS. Recommended by Clerk's Expo OAuth guide.

```ts
function useWarmUpBrowser(): void
```

Call it from the screen that holds the Google button, not from the app
root: the warm-up is released on unmount, so holding a browser process open
for the whole session buys nothing.

Purely an optimisation. If it fails the login still works, just more
slowly, which is why neither call is awaited or caught.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/use-warm-up-browser.ts#L22)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/use-warm-up-browser.ts)
