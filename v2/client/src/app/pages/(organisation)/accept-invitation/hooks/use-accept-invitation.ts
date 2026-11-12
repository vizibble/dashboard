import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authClient } from '@/app/pages/(auth)/client';
import { getErrorMessage } from '@/app/shared/utils/error-message';

export type InvitationState =
  | { status: 'checking' }
  | { status: 'authentication-required' }
  | { status: 'accepting' }
  | { status: 'error'; message: string };

export function useAcceptInvitation(invitationId: string | null) {
  const navigate = useNavigate();

  const [state, setState] = useState<InvitationState>(() =>
    invitationId
      ? { status: 'checking' }
      : {
          status: 'error',
          message: 'This invitation link is missing its invitation ID.',
        },
  );

  useEffect(() => {
    if (!invitationId) {
      return;
    }
    const validInvitationId = invitationId;

    let active = true;

    async function processInvitation() {
      try {
        const sessionResult = await authClient.getSession();

        if (!active) {
          return;
        }
        if (sessionResult.error) {
          setState({
            status: 'error',
            message: sessionResult.error.message || 'Unable to check your sign-in status.',
          });

          return;
        }
        if (!sessionResult.data?.user) {
          setState({ status: 'authentication-required' });

          return;
        }
        setState({ status: 'accepting' });
        const result = await authClient.organization.acceptInvitation({
          invitationId: validInvitationId,
        });

        if (!active) {
          return;
        }
        if (result.error) {
          setState({
            status: 'error',
            message: result.error.message || 'Unable to accept the invitation.',
          });

          return;
        }
        void navigate('/dashboard', { replace: true });
      } catch (cause: unknown) {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          message: getErrorMessage(cause, 'Unable to process the invitation.'),
        });
      }
    }

    void processInvitation();

    return () => {
      active = false;
    };
  }, [invitationId, navigate]);

  return { state };
}
