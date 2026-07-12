export function getClerkErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown[] }).errors)
  ) {
    const first = (error as { errors: Array<{ message?: string }> }).errors[0];
    if (first?.message) return first.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
