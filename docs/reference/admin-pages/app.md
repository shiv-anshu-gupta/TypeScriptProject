# App

Root component: starts the auth bootstrap, then renders the router.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/App.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`App`](#component-app) | React component | `function App(): Element` | Renders the whole admin app. |

## Exports in detail

### `App` {#component-app}

*React component · default export*

Renders the whole admin app.

```ts
function App(): Element
```

Takes no props.

**Returns** `Element` &mdash; The router provider for [`router`](router.md#constant-router).

`useBootstrapAuth` is called here, above the router, so it runs exactly once
for the life of the page. It installs the axios token getter and populates
the auth store with the signed-in user and their role. The route guards read
only that store, so they cannot run before this hook has had its first turn —
which is why they all check `isBootstrapped` before deciding anything.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/App.tsx#L22)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/App.tsx)
