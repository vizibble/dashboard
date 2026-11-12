import { authClient } from '@/app/pages/(auth)/client';
import type { LoginInput } from '@/app/pages/(auth)/login/schemas/login-schema';
import { getAuthErrorMessage, logAuthFailure } from '@/app/pages/(auth)/shared/utils/auth-errors';
import {
  getAuthFlowParams,
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

  const { invitationId, next, authQuery } = getAuthFlowParams(searchParams, '/dashboard');

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
        setSubmitError(
          getAuthErrorMessage(
            result.error,
            'Too many attempts. Wait a minute and try again.',
            'Incorrect email or password.',
          ),
        );

        return;
      }
      // Signing in for an AI app (ChatGPT, Claude): the OAuth client plugin continues to consent.
      if (isOAuthRequest(searchParams)) {
        return;
      }
      void navigate(next);
    } catch (cause) {
      logAuthFailure(cause);
      setSubmitError('Unable to log in.');
    }
  };

  return { onSubmit, submitError, invitationId, authQuery };
}
