# Message

The conversation between a customer and the shop about one order.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Message.ts` |
| Group | [Server — models](index.md) |
| Exports | 4 |

## Description

A chat message tied to one grocery list/order. Either the customer or the
shop ("staff") can send. Kept in its own collection (not embedded in the
list) so a long conversation never bloats the order document.

Messages are not kept for ever: MongoDB deletes each one 30 days after it
was sent - see the TTL index near the bottom of this file.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Message`](#type-message) | Type | `type Message = { … };` | One message. |
| [`Message`](#variable-message) | Variable | `const Message: Model<any, object, object, object, any, any, any>` | The Message model. |
| [`MessageDocument`](#type-message-document) | Type | `type MessageDocument = HydratedDocument<Message>;` | A saved message, as Mongoose hands it back. |
| [`MessageSender`](#type-message-sender) | Type | `type MessageSender = "customer" \| "staff";` | Which side sent the message. |

## Exports in detail

### `Message` {#type-message}

*Type*

One message. Notes on individual fields are beside the fields.

```ts
type Message = {
  groceryList: Types.ObjectId;
  user: Types.ObjectId;
  sender: MessageSender;
  senderName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | — |
| `groceryList` | `Types.ObjectId` | — |
| `sender` | `MessageSender` | — |
| `senderName` | `string` | — |
| `text` | `string` | — |
| `updatedAt` | `Date` | — |
| `user` | `Types.ObjectId` | — |

`user` duplicates the list's owner so that a customer's messages can be
scoped and pushed to without reading the list first.

`senderName` is copied in rather than looked up, so the name shown is the
one used at the time.

`text` is capped at 1000 characters by the schema.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Message.ts#L38)

### `Message` {#variable-message}

*Variable*

The Message model.

```ts
const Message: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice.

Nothing in the app deletes a message; the TTL index above does it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Message.ts#L38)

### `MessageDocument` {#type-message-document}

*Type*

A saved message, as Mongoose hands it back.

```ts
type MessageDocument = HydratedDocument<Message>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Message.ts#L49)

### `MessageSender` {#type-message-sender}

*Type*

Which side sent the message.

```ts
type MessageSender = "customer" | "staff";
```

`customer` is the person who owns the order; `staff` is anyone on the shop
side. There is no finer distinction - the shop is one voice to the
customer, whoever at the counter actually typed it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Message.ts#L24)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Message.ts)
