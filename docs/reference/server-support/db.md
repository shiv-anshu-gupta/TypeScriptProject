# connectDB `db`

The process's single MongoDB connection.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/db.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`connectDB`](#function-connect-db) | Function | `function connectDB(): Promise<void>` | Opens the shared Mongoose connection and waits for it. |

## Exports in detail

### `connectDB` {#function-connect-db}

*Function*

Opens the shared Mongoose connection and waits for it.

```ts
function connectDB(): Promise<void>
```

**Returns** `Promise<void>`

Awaited once at boot, before Express starts listening, so no route can ever
run without a database behind it. The connection string comes from
`MONGO_URI`; if it is missing or unreachable this rejects and takes the
process down, which is preferred to serving requests that cannot work.

Mongoose keeps one pooled connection for the whole process, so nothing else
needs to call this - models simply use the default connection.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/db.ts#L20)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/db.ts)
