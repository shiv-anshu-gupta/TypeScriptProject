// Make user-typed text safe to use inside a MongoDB $regex.
//
// A search box is free text: "(", "*", "+" or "?" make an invalid regular
// expression (the query throws and the customer sees "no products"), and a
// crafted one can be made slow on purpose.
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
