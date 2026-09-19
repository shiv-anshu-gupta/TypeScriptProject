# Commonloader `Loader`

The full-screen spinner shown while the route guards wait.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/common/Loader.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Commonloader`](#component-commonloader) | React component | `function Commonloader(props: CommonLoaderProps): Element` | A centred spinner with a caption. |

## Exports in detail

### `Commonloader` {#component-commonloader}

*React component*

A centred spinner with a caption.

```ts
function Commonloader(props: CommonLoaderProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `className?` | `string` | Classes for the outer wrapper. |
| `iconClassName?` | `string` | Classes for the spinner icon, merged the same way. |
| `text?` | `string` | Message under the spinner. Defaults to "Loading...". |

**Returns** `Element`

Used by all three route guards while Clerk resolves the session and the auth
bootstrap finishes. It fills the viewport by default, because at that point
there is no layout around it.

Note the lower-case `l` in the name — it is `Commonloader`, not
`CommonLoader`, which makes it easy to miss when searching.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/common/Loader.tsx#L44)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/common/Loader.tsx)
