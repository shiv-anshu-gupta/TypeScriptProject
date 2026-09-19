# SearchBar

The product search field, and the button that looks like it.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/SearchBar.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`SearchBar`](#component-search-bar) | React component | `function SearchBar(props: SearchBarProps): Element` | The box the customer types a product name into, with a clear button once there is something in it. |
| [`SearchEntry`](#component-search-entry) | React component | `function SearchEntry(props: SearchEntryProps): Element` | A search box on the Home screen that cannot be typed into — tapping it goes to the Shop tab with the real field focused. |

## Exports in detail

### `SearchBar` {#component-search-bar}

*React component*

The box the customer types a product name into, with a clear button once
there is something in it.

```ts
function SearchBar(props: SearchBarProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `autoFocus?` | `boolean` | — |
| `onChangeText` | `(text: string) => void` | — |
| `onSubmit?` | `() => void` | The keyboard's search key. Results normally appear as the customer types, so this is a convenience, not the way to search. |
| `placeholder` | `string` | — |
| `value` | `string` | — |

**Returns** `Element`

The one product-search field, shared by Home and Shop so both look and behave
the same. Sizing is left to the caller: wrap it in a flex-1 view in a row, or
let it fill the width in a column.

Fully controlled, and it debounces nothing — the caller decides when to ask
the server. The Shop screen also remounts it by key to take focus again when
it is already open.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/SearchBar.tsx#L35)

### `SearchEntry` {#component-search-entry}

*React component*

A search box on the Home screen that cannot be typed into — tapping it goes
to the Shop tab with the real field focused.

```ts
function SearchEntry(props: SearchEntryProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onPress` | `() => void` | — |
| `placeholder` | `string` | — |

**Returns** `Element`

Looks exactly like the search field, but is a button that takes the customer
straight to where searching happens (the Shop tab, field focused, results
appearing as they type). Typing into a field that shows nothing until you
find the keyboard's search key looks broken, especially to someone who
doesn't know that key is there.

**See also**

- [`SearchBar`](#component-search-bar) for the field this imitates.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/SearchBar.tsx#L90)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/SearchBar.tsx)
