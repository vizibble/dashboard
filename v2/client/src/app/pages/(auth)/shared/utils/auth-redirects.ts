/**
 * Accept only same-app relative paths.
 * Prevents open redirects through untrusted callback parameters.
 */
export function getSafeReturnPath(value: string | null | undefined, fallback = '/dashboard'): string {
  const isSafePath = (path: string): boolean => {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
      return false;
    }
    const hasControlCharacters = [...path].some(
      (char) => char.charCodeAt(0) <= 31 || char.charCodeAt(0) === 127,
    );

    if (hasControlCharacters) {
      return false;
    }
    try {
      return new URL(path, 'https://app.invalid').origin === 'https://app.invalid';
    } catch {
      return false;
    }
  };

  if (value && isSafePath(value)) {
    return value;
  }

  return isSafePath(fallback) ? fallback : '/dashboard';
}

/**
 * Frontend callback after Better Auth verifies the email.
 */
export function getVerificationCallbackUrl(next: string): string {
  const safeNext = getSafeReturnPath(next);

  const url = new URL('/verify-email', window.location.origin);

  url.searchParams.set('next', safeNext);

  return url.toString();
}

/**
 * Frontend destination for Better Auth password reset emails.
 * Better Auth appends the reset token to this URL.
 */
export function getResetPasswordRedirectUrl(): string {
  return new URL('/reset-password', window.location.origin).toString();
}

export type CheckEmailState = {
  email?: string;
  next?: string;
};

export type AuthFlowParams = {
  invitationId: string | null;
  /** Where to go once authenticated. */
  next: string;
  /** Query to carry between login and signup links. */
  authQuery: string;
};

/**
 * Reads the invitation / returnTo params shared by login and signup.
 */
export function getAuthFlowParams(searchParams: URLSearchParams, fallback: string): AuthFlowParams {
  const invitationId = searchParams.get('invitationId');

  const returnTo = getSafeReturnPath(searchParams.get('returnTo'), fallback);

  const authParams = new URLSearchParams();

  if (invitationId) {
    authParams.set('invitationId', invitationId);
  }
  if (searchParams.has('returnTo')) {
    authParams.set('returnTo', returnTo);
  }
  const next = invitationId ? `/accept-invitation?id=${encodeURIComponent(invitationId)}` : returnTo;

  return { invitationId, next, authQuery: authParams.toString() };
}
