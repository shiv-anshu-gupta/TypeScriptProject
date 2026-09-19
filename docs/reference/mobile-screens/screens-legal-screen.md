# LegalScreen

The privacy policy and terms, written into this file.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/LegalScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Description

Plain-language Privacy Policy + Terms tailored to this app's model:
a digital order-list / quote tool for a single shop, with pay-and-collect
in person. Not legal advice — have a professional skim it before launch.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`LegalScreen`](#component-legal-screen) | React component | `function LegalScreen(): Element` | The privacy policy and terms as one scrolling page, reached from Account and from the consent line under the login. |

## Exports in detail

### `LegalScreen` {#component-legal-screen}

*React component*

The privacy policy and terms as one scrolling page, reached from Account and
from the consent line under the login.

```ts
function LegalScreen(): Element
```

Takes no props.

**Returns** `Element`

The text is hard-coded here rather than translated or fetched, so it is the
same wording for every customer and ships with the build. It reads no store
and loads nothing.

`SHOP_NAME`, `CONTACT_EMAIL` and `LAST_UPDATED` at the top of this file must
be edited for a real shop before publishing.

It describes the photo flow — the photo is read and discarded, and never
stored. Keep that in step with what the camera button actually does.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/LegalScreen.tsx#L57)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/LegalScreen.tsx)
