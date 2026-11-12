import { getErrorMessage } from '@/app/shared/utils/error-message';

type AuthError = { status?: number };

/** Picks the rate-limit message for a 429, otherwise the fallback. */
export function getAuthErrorMessage(error: AuthError, rateLimitedMessage: string, fallback: string): string {
  if (error.status === 429) {
    return rateLimitedMessage;
  }

  return fallback;
}

/** Logs an unexpected throw from a Better Auth call without surfacing details to the user. */
export function logAuthFailure(cause: unknown): void {
  if (!(cause instanceof Error)) {
    return;
  }
  console.error(getErrorMessage(cause));
}
