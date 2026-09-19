# ProfileAvatar

The customer's avatar square.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ProfileAvatar.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProfileAvatar`](#component-profile-avatar) | React component | `function ProfileAvatar(props: ProfileAvatarProps): Element` | A rounded square in the brand colour showing the customer's first initial. |

## Exports in detail

### `ProfileAvatar` {#component-profile-avatar}

*React component*

A rounded square in the brand colour showing the customer's first initial.

```ts
function ProfileAvatar(props: ProfileAvatarProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `name?` | `string` | — |
| `size` | `number` | The width and height in points. Everything else is derived from it, so the shape is identical at any size. |

**Returns** `Element`

The customer's avatar: their initial on the brand colour. Shared by the Home
header and the Account screen so the two always match. Corner radius and
letter size scale with `size`, so every avatar is the same shape. With no
name (signed out) it shows a person glyph rather than a guessed letter.

It reads no store. The caller supplies the name, which lets Home and Account
both prefer the saved profile over the Clerk account.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ProfileAvatar.tsx#L30)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ProfileAvatar.tsx)
