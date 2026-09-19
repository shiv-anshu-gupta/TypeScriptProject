# App

The root of the app: the provider tree, the startup effects, and the two screens that sit outside the navigator.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/App.tsx` |
| Group | [Mobile app — navigation](index.md) |
| Exports | 1 |

## Description

The order of the providers is load-bearing and two placements have bitten
before — the portal host sits inside the navigation container, and the
toaster sits outside the portal host. Both are explained where they are
written.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`App`](#component-app) | React component | `function App(): Element` | Mounts the provider tree, and gates the first launch on a language. |

## Exports in detail

### `App` {#component-app}

*React component · default export*

Mounts the provider tree, and gates the first launch on a language.

```ts
function App(): Element
```

Takes no props.

**Returns** `Element`

Three things it owns that are easy to miss.

**The language gate.** Nothing renders until the saved language has been
read back. With none stored, this is a first launch and the picker is shown
instead of the app — deliberately bilingual, so either audience can read
it.

**The splash is a decoration.** Its progress counter is a timer, not real
loading: 4 % every 40 ms, then a 700 ms hold. The app underneath is mounted
from the start and the splash is drawn **over** it, so Clerk, the first
Home request and the customer's lists all load while the logo is still
showing — instead of starting only once it disappears. Changing the timings
changes how long the logo shows and nothing else.

**Two screens are not in any navigator.** The splash and the language
picker are rendered here directly, which is why neither can navigate and
both take a callback instead.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/App.tsx#L125)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/App.tsx)
