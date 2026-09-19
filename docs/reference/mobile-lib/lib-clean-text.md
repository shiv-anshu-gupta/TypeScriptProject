# stripSpecials `clean-text`

The app's one rule for which characters a customer may type into a field the shop will read.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/clean-text.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`stripSpecials`](#function-strip-specials) | Function | `function stripSpecials(value: string): string` | Removes the blocked characters from typed text. |

## Exports in detail

### `stripSpecials` {#function-strip-specials}

*Function*

Removes the blocked characters from typed text.

```ts
function stripSpecials(value: string): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `value` | `string` | — |

**Returns** `string`

Applied on every keystroke, not on submit, so the field never shows a
character that would later vanish. Every write to a draft row goes through
it, and so do the profile name and the name given at sign-up.

It removes and never rejects: a name made entirely of blocked characters
comes back as an empty string rather than an error. Hindi, English, digits,
spaces, `.` `,` `&` `'` `-` `/` `(` `)` `%` and `×` all survive.

A nullish value is tolerated and answers `""`, because callers pass a
`TextInput` value straight through.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/clean-text.ts#L31)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/clean-text.ts)
