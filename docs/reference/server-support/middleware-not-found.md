# notFound

The catch-all for a path no router claimed.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/middleware/notFound.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`notFound`](#function-not-found) | Function | `function notFound(req: Request, res: Response): void` | Answers 404 in the standard error envelope. |

## Exports in detail

### `notFound` {#function-not-found}

*Function*

Answers 404 in the standard error envelope.

```ts
function notFound(req: Request, res: Response): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `req` | `Request` | — |
| `res` | `Response` | — |

Mounted after every router and before the error handler, so a request that
matched nothing still gets the same JSON shape as everything else rather
than Express's HTML page.

The message carries the method only, not the path - an unmatched path is
caller-controlled text and is kept out of the response.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/notFound.ts#L20)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/notFound.ts)
