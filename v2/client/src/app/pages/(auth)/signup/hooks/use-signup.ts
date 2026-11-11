import { authClient } from '@/app/pages/(auth)/client';
import {
  getSafeReturnPath,
  getVerificationCallbackUrl,
  type CheckEmailState,
} from '@/app/pages/(auth)/shared/utils/auth-redirects';
import type { SignupInput } from '@/app/pages/(auth)/signup/schemas/signup-schema';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function useSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get('invitationId');
  const returnTo = getSafeReturnPath(searchParams.get('returnTo'), '/organisation/setup');
  const next = invitationId ? `/accept-invitation?id=${encodeURIComponent(invitationId)}` : returnTo;
  const authParams = new URLSearchParams();
  if (invitationId) {
    authParams.set('invitationId', invitationId);
  }
  if (searchParams.has('returnTo')) {
    authParams.set('returnTo', returnTo);
  }

  const [submitError, setSubmitError] = useState<string>();
  const onSubmit = async (data: SignupInput) => {
    setSubmitError(undefined);
    try {
      const result = await authClient.signUp.email({
        ...data,
        callbackURL: getVerificationCallbackUrl(next),
      });
      if (result.error) {
        setSubmitError(
          result.error.status === 429
            ? 'Too many attempts. Wait a minute and try again.'
            : 'Unable to create your account.',
        );
        return;
      }
      // Same screen whether or not the email was already registered
      const state: CheckEmailState = { email: data.email, next };
      void navigate('/check-email', { state });
    } catch (cause) {
      if (cause instanceof Error) {
        console.error(cause.message);
      }
      setSubmitError('Unable to create your account.');
    }
  };

  return {
    onSubmit,
    submitError,
    invitationId,
    authQuery: authParams.toString(),
  };
}
