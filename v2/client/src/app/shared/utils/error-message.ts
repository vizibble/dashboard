/** A user-facing message for anything thrown by a request or handler. */
export function getErrorMessage(
  cause: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (cause instanceof Error && cause.message) {
    return cause.message;
  }

  return fallback;
}
