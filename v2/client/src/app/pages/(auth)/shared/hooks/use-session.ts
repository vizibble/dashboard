import { authClient } from '@/app/pages/(auth)/client';

type SessionState =
  | { status: 'loading' }
  | { status: 'signed-in'; email: string; emailVerified: boolean }
  | { status: 'signed-out' }
  | { status: 'error'; error: string };

const SESSION_ERROR = 'Unable to verify your session.';

/** Better Auth's reactive session, narrowed to what route guards need. */
export function useSession(): SessionState {
  const { data, isPending, error } = authClient.useSession();

  if (isPending) {
    return { status: 'loading' };
  }
  if (error) {
    return { status: 'error', error: error.message || SESSION_ERROR };
  }
  if (!data) {
    return { status: 'signed-out' };
  }

  return { status: 'signed-in', email: data.user.email, emailVerified: data.user.emailVerified };
}
