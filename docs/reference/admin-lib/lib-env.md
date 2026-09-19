# env

Build-time configuration read from Vite environment variables.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/env.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`env`](#constant-env) | Constant | `const env: { backendUrl: any }` | Where the API lives. |

## Exports in detail

### `env` {#constant-env}

*Constant*

Where the API lives.

```ts
const env: { backendUrl: any }
```

Vite substitutes `import.meta.env.VITE_*` textually during the build, so
`backendUrl` becomes a string literal inside `dist/assets/*.js`. Nothing
reads the variable at runtime. Changing `VITE_BACKEND_URL` in Vercel
therefore does nothing until the client project is redeployed.

The localhost fallback is there for local development. If the variable is
missing from a production build the app will silently try to call
`http://localhost:5000` and every request will fail — there is no warning.

The value must also appear in the server's `CORS_ORIGINS` allowlist the other
way round: matching is exact on scheme, host and port, with no wildcards and
no trailing slash. A mismatch surfaces only as `"Network Error"`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/env.ts#L24)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/env.ts)
