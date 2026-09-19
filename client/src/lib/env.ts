/**
 * Build-time configuration read from Vite environment variables.
 *
 * @packageDocumentation
 */

/**
 * Where the API lives.
 *
 * @remarks
 * Vite substitutes `import.meta.env.VITE_*` textually during the build, so
 * `backendUrl` becomes a string literal inside `dist/assets/*.js`. Nothing
 * reads the variable at runtime. Changing `VITE_BACKEND_URL` in Vercel
 * therefore does nothing until the client project is redeployed.
 *
 * The localhost fallback is there for local development. If the variable is
 * missing from a production build the app will silently try to call
 * `http://localhost:5000` and every request will fail — there is no warning.
 *
 * The value must also appear in the server's `CORS_ORIGINS` allowlist the other
 * way round: matching is exact on scheme, host and port, with no wildcards and
 * no trailing slash. A mismatch surfaces only as `"Network Error"`.
 */
export const env = {
  backendUrl: import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000",
};
