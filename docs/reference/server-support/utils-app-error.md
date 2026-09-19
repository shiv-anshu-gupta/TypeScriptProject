# AppError

The error type used whenever a failure has a status the caller should see.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/AppError.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AppError`](#class-app-error) | Class | `class AppError extends Error` | An error that carries the HTTP status to answer with. |

## Exports in detail

### `AppError` {#class-app-error}

*Class*

An error that carries the HTTP status to answer with.

```ts
class AppError extends Error
```

| Property | Type | Meaning |
|---|---|---|
| `statusCode` | `number` | — |

| Method | Signature | Brief |
|---|---|---|
| `constructor` | `constructor(statusCode: number, message: string): AppError` | — |

`errorHandler` in middleware/errorhandler.ts is the only reader of
`statusCode`: an `AppError` becomes that status with its message passed
through to the client, while every other error becomes a 500 with a generic
message and the real one only in the log.

So the choice of error type decides what the customer is told. Throw an
`AppError` for anything they are allowed to read ("Product not found",
"This list already has too many items"), and a plain `Error` for anything
that should stay internal.

The message is sent verbatim, so it must never contain a stack trace, a
database detail or a key.

**Example**

```ts
throw new AppError(404, "Product not found");
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/AppError.ts#L29)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/AppError.ts)
