# notifyNewOrders `order-alert`

The in-page "a new list has arrived" alert: a chime, a flashing tab title and a toast.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/order-alert.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 1 |

## Description

This is separate from, and independent of, browser push. It needs no Firebase
configuration and no notification permission, and it works only while the
admin tab is open. The grocery-lists hook calls it when its 15-second poll
returns a list id it has not seen before.

Browser push (`lib/firebase.ts`) is the other half: it covers the case where
the tab is closed or backgrounded. The two can both fire for the same order.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`notifyNewOrders`](#function-notify-new-orders) | Function | `function notifyNewOrders(count: number, customer?: string): void` | Announces newly arrived grocery lists to the shopkeeper. |

## Exports in detail

### `notifyNewOrders` {#function-notify-new-orders}

*Function*

Announces newly arrived grocery lists to the shopkeeper.

```ts
function notifyNewOrders(count: number, customer?: string): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `count` | `number` | How many new lists arrived in this poll. Drives both the plural wording and the tab-title text. |
| `customer?` | `string` | Customer name, used only when `count` is 1. With several lists there is no single name to show. |

Fires all three signals together, because no single one is reliable on its
own: the chime is inaudible in a noisy shop, the title flash is invisible
when the tab is already focused, and the toast is missed when the shopkeeper
is not looking at the screen.

Caveats worth knowing:

- The chime is silent until the shopkeeper has clicked or typed somewhere on
  the page at least once. Browsers block audio before a user gesture, so a
  tab that was opened and then left untouched never beeps.
- The title flash stops the moment the tab regains focus, so it is a cue
  only for a backgrounded tab.
- The toast lasts 8 seconds, longer than the default, to give the shopkeeper
  a chance to notice it.

Calling this does not mark anything as seen. The caller owns the set of ids
it has already alerted on.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/order-alert.ts#L129)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/order-alert.ts)
