# asyncHandler

Adapter that lets async route handlers throw.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/asyncHandler.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`asyncHandler`](#function-async-handler) | Function | `function asyncHandler( … ): (req: Request, res: Response, next: NextFunction) => void` | Wraps an async route handler so that a rejected promise reaches `next()`. |

## Exports in detail

### `asyncHandler` {#function-async-handler}

*Function*

Wraps an async route handler so that a rejected promise reaches `next()`.

```ts
function asyncHandler(
  func: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void
```

| Parameter | Type | Meaning |
|---|---|---|
| `func` | `(req: Request, res: Response, next: NextFunction) => Promise<void>` | — |

**Returns** `(req: Request, res: Response, next: NextFunction) => void` &mdash; A plain Express handler, safe to pass to `app.use` or a route.

Express does not await a handler, so without this a throw inside an async
function would become an unhandled rejection and the request would hang
until the client gave up. Wrapping it means a handler can simply
`throw new AppError(...)` and the error middleware will answer.

Every async handler in routes/ is registered through this.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/asyncHandler.ts#L21)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/asyncHandler.ts)
