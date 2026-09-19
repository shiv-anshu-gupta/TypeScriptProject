# AdminMessages `Messages`

`/admin/messages` — every customer conversation in one list.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/admin/Messages.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

A second way into the same chat threads that already appear inside each
grocery-list card. It exists so the shop can answer messages without first
finding the order they belong to.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminMessages`](#component-admin-messages) | React component | `function AdminMessages(): Element` | Lists every conversation, newest activity first, and opens one in place. |

## Exports in detail

### `AdminMessages` {#component-admin-messages}

*React component · default export*

Lists every conversation, newest activity first, and opens one in place.

```ts
function AdminMessages(): Element
```

Takes no props.

**Returns** `Element` &mdash; The messages screen.

Loads `GET /admin/grocery-lists/conversations` on mount and then every 15
seconds, matching the grocery-lists page. A failed poll is caught and
ignored on purpose, so a momentary network problem does not blank a list the
shopkeeper is reading — which also means an outage is invisible here.

Each row shows the customer, the order code, their phone, and the last
message. A `You:` prefix marks a message the shop sent, and a "reply" pill
marks one from the customer — that pill is the page's only cue that something
still needs an answer. It is derived purely from who spoke last, so it does
not disappear when the shopkeeper reads the message, only when they reply.

Opening a row mounts `GroceryListChat` with `startOpen`, so it inherits that
component's own 5-second message poll. Only one row is open at a time, and
closing it unmounts the chat and stops that poll.

The open row is local state, so it is forgotten on navigation or reload.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Messages.tsx#L43)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Messages.tsx)
