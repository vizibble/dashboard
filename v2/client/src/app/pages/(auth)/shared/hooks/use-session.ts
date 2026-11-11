import { authClient } from '@/app/pages/(auth)/client';
import { useEffect, useState } from 'react';

type SessionState =
  | { status: 'loading' }
  | { status: 'signed-in'; email: string; emailVerified: boolean }
  | { status: 'signed-out' }
  | { status: 'error'; error: string };

export function useSession() {
  const [state, setState] = useState<SessionState>({
    status: 'loading',
  });

  useEffect(() => {
    let active = true;
    async function checkSession() {
      setState({ status: 'loading' });
      try {
        const result = await authClient.getSession();
        if (!active) {
          return;
        }
        if (result.error) {
          setState({
            status: 'error',
            error: result.error.message || 'Unable to verify your session.',
          });
          return;
        }
        const user = result.data?.user;
        setState(
          user
            ? { status: 'signed-in', email: user.email, emailVerified: user.emailVerified }
            : { status: 'signed-out' },
        );
      } catch (cause: unknown) {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          error: cause instanceof Error ? cause.message : 'Unable to verify your session.',
        });
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
