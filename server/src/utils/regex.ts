/**
 * Escaping for text that will be used as a pattern.
 *
 * @packageDocumentation
 */

/**
 * Make user-typed text safe to use inside a MongoDB `$regex`.
 *
 * @remarks
 * A search box is free text: "(", "*", "+" or "?" make an invalid regular
 * expression (the query throws and the customer sees "no products"), and a
 * crafted one can be made slow on purpose.
 *
 * Every regex metacharacter is escaped, so the result matches the typed text
 * literally. Used by the product search in both the admin and customer
 * product routes.
 *
 * @returns The input with each metacharacter backslash-escaped.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
