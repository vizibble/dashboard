import { authClient } from '@/app/pages/(auth)/client';
import { getVerificationCallbackUrl } from '@/app/pages/(auth)/shared/utils/auth-redirects';
import { useEffect, useState } from 'react';

const COOLDOWN_SECONDS = 60;

type ResendStatus = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

export function useResendVerification(next: string) {
  const [status, setStatus] = useState<ResendStatus>({ kind: 'idle' });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const resend = async (email: string) => {
    setStatus({ kind: 'sending' });
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: getVerificationCallbackUrl(next),
      });
      if (result.error) {
        setStatus({
          kind: 'error',
          message:
            result.error.status === 429
              ? 'Too many requests. Wait a few minutes and try again.'
              : 'Unable to resend the email. Try again.',
        });
        return;
      }
      setStatus({ kind: 'sent' });
      setCooldown(COOLDOWN_SECONDS);
    } catch (cause) {
      if (cause instanceof Error) {
        console.error(cause.message);
      }
      setStatus({ kind: 'error', message: 'Unable to resend the email. Try again.' });
    }
  };

  return { resend, status, cooldown };
}
