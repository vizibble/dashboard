import { authClient } from '@/app/pages/(auth)/client';
import type { LoginInput } from '@/app/pages/(auth)/login/schemas/login-schema';
import {
  getSafeReturnPath,
  getVerificationCallbackUrl,
  type CheckEmailState,
} from '@/app/pages/(auth)/shared/utils/auth-redirects';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/** Better Auth's OAuth provider sends sign-ins for AI apps here with a signed query. */
function isOAuthRequest(params: URLSearchParams) {
  return params.has('sig') && params.has('client_id');
}

export function useLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get('invitationId');
  const returnTo = getSafeReturnPath(searchParams.get('returnTo'), '/dashboard');
  const next = invitationId ? `/accept-invitation?id=${encodeURIComponent(invitationId)}` : returnTo;
  const authParams = new URLSearchParams();
  if (invitationId) {
    authParams.set('invitationId', invitationId);
  }
  if (searchParams.has('returnTo')) {
    authParams.set('returnTo', returnTo);
  }

  const [submitError, setSubmitError] = useState<string>();
  const onSubmit = async (data: LoginInput) => {
    setSubmitError(undefined);
    try {
      const result = await authClient.signIn.email({
        ...data,
        callbackURL: getVerificationCallbackUrl(next),
      });
      if (result.error) {
        // Only returned after a correct password, so it doesn't reveal whether an account exists
        if (result.error.code === 'EMAIL_NOT_VERIFIED') {
          const state: CheckEmailState = { email: data.email, next };
          void navigate('/check-email', { state });
          return;
        }
        if (result.error.status === 429) {
          setSubmitError('Too many attempts. Wait a minute and try again.');
          return;
        }
        setSubmitError('Incorrect email or password.');
        return;
      }
      // Signing in for an AI app (ChatGPT, Claude): the OAuth client plugin continues to consent.
      if (isOAuthRequest(searchParams)) return;
      void navigate(next);
    } catch (cause) {
      if (cause instanceof Error) {
        console.error(cause.message);
      }
      setSubmitError('Unable to log in.');
    }
  };

  return {
    onSubmit,
    submitError,
    invitationId,
    authQuery: authParams.toString(),
  };
}
