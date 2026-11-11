import { authClient } from '@/app/pages/(auth)/client';
import type { ResetPasswordInput } from '@/app/pages/(auth)/(password)/reset-password/schemas/reset-password-schema';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type ResetStatus = 'ready' | 'invalid' | 'done';

export function useResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasLinkError = searchParams.has('error') || !token;

  const [status, setStatus] = useState<ResetStatus>(hasLinkError ? 'invalid' : 'ready');
  const [submitError, setSubmitError] = useState<string>();

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    setSubmitError(undefined);
    try {
      const result = await authClient.resetPassword({ newPassword: data.password, token });
      if (result.error) {
        if (result.error.code === 'INVALID_TOKEN') {
          setStatus('invalid');
          return;
        }
        setSubmitError(
          result.error.status === 429
            ? 'Too many attempts. Wait a few minutes and try again.'
            : 'Unable to update your password. Try again.',
        );
        return;
      }
      setStatus('done');
    } catch (cause) {
      if (cause instanceof Error) {
        console.error(cause.message);
      }
      setSubmitError('Unable to update your password. Try again.');
    }
  };

  return { status, onSubmit, submitError };
}
