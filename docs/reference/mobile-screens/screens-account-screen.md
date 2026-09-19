# AccountScreen

The Account tab: identity, saved details, counters, settings, sign out.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/AccountScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AccountScreen`](#component-account-screen) | React component | `function AccountScreen(): Element` | Who the customer is, what the shop has on file for them, how many orders they have placed, and the app's settings. |

## Exports in detail

### `AccountScreen` {#component-account-screen}

*React component*

Who the customer is, what the shop has on file for them, how many orders
they have placed, and the app's settings.

```ts
function AccountScreen(): Element
```

Takes no props.

**Returns** `Element`

Signed out it renders the login in place of its content, with the settings
that work without an account — language and terms — in the footer below it.

Signed in, it reloads the orders and the saved profile on every focus.
Reads `useCustomerGroceryListStore` for the counters and the phone on file,
`useCustomerAccountStore` for the saved profile, and Clerk's `useUser` as
the fallback. Display values prefer the saved profile, because that is what
the shop actually sees on an order.

It opens one sheet, [`ProfileEditSheet`](../mobile-components/components-profile-edit-sheet.md#component-profile-edit-sheet), and owns the save: the
request, the store update and the toast all happen here, and the orders are
reloaded afterwards because they carry the customer's phone.

Signing out hands this device's push token back to the server first, while
the session still exists. Without that the next person on a shared phone
would keep receiving the previous customer's order alerts.

The Help row only appears when a shop WhatsApp number is configured.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/AccountScreen.tsx#L215)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/AccountScreen.tsx)
