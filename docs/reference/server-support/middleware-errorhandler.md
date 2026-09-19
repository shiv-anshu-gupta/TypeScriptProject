# errorHandler `errorhandler`

The one place a failed request becomes a response.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/middleware/errorhandler.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`errorHandler`](#function-error-handler) | Function | `function errorHandler( … ): Response<any, Record<string, any>>` | Express error middleware: turns anything thrown into an error envelope. |

## Exports in detail

### `errorHandler` {#function-error-handler}

*Function*

Express error middleware: turns anything thrown into an error envelope.

```ts
function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response<any, Record<string, any>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `err` | `unknown` | — |
| `_req` | `Request` | — |
| `res` | `Response` | — |
| `_next` | `NextFunction` | — |

**Returns** `Response<any, Record<string, any>>`

Two cases, and the difference is the whole point of [`AppError`](utils-app-error.md#class-app-error):

- an `AppError` answers with its own `statusCode`, its message passed
  through to the caller, and the code `APP_ERROR`;
- anything else is logged in full and answered with a bare 500 and the
  code `INTERNAL`, so a stack trace or a database message never leaves the
  server.

Must be registered last, after every router and after `notFound`, and must
keep all four parameters - Express identifies error middleware by its
arity, so dropping the unused `next` would silently stop it being called.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/errorhandler.ts#L26)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/errorhandler.ts)
