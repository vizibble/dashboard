import { authClient } from '@/app/pages/(auth)/client';
import type { ForgotPasswordInput } from '@/app/pages/(auth)/(password)/forgot-password/schemas/forgot-password-schema';
import { getResetPasswordRedirectUrl } from '@/app/pages/(auth)/shared/utils/auth-redirects';
import { useState } from 'react';

export function useForgotPassword() {
  const [sentTo, setSentTo] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();

  const onSubmit = async (data: ForgotPasswordInput) => {
    setSubmitError(undefined);
    try {
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: getResetPasswordRedirectUrl(),
      });
      if (result.error) {
        setSubmitError(
          result.error.status === 429
            ? 'Too many requests. Wait a few minutes and try again.'
            : 'Unable to send a reset link. Try again.',
        );
        return;
      }
      // The response is the same whether or not the account exists
      setSentTo(data.email);
    } catch (cause) {
      if (cause instanceof Error) {
        console.error(cause.message);
      }
      setSubmitError('Unable to send a reset link. Try again.');
    }
  };

  return {
    onSubmit,
    sentTo,
    submitError,
    reset: () => setSentTo(undefined),
  };
}
