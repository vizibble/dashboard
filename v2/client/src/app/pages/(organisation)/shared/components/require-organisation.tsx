import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { authClient, unwrap } from '@/app/pages/(auth)/client';
import type { OrganisationContextValue, OrganisationSummary } from '@/app/pages/(organisation)/context';
import { organisationContext } from '@/app/pages/(organisation)/context';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { LoadingState } from '@/app/shared/components/states/loading-state';
import { getErrorMessage } from '@/app/shared/utils/error-message';

type GateState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'allowed'; organisation: OrganisationSummary; role: string }
  | { status: 'no-organisation' };

async function fetchRole(organizationId: string): Promise<string> {
  const member = await unwrap(
    authClient.organization.getActiveMemberRole({ query: { organizationId } }),
    'Unable to load your organisation role.',
  );

  return member.role;
}

export function RequireOrganisation() {
  const [state, setState] = useState<GateState>({ status: 'loading' });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function checkOrganisation() {
      setState({ status: 'loading' });
      try {
        const organisations = await unwrap(
          authClient.organization.list(),
          'Unable to load your organisation membership.',
        );

        if (!active) {
          return;
        }
        const org = organisations[0];

        if (!org) {
          setState({ status: 'no-organisation' });

          return;
        }
        const role = await fetchRole(org.id);

        if (!active) {
          return;
        }
        setState({
          status: 'allowed',
          organisation: {
            id: org.id,
            name: org.name,
            slug: org.slug,
          },
          role,
        });
      } catch (cause: unknown) {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          message: getErrorMessage(cause, 'Unable to check organisation access.'),
        });
      }
    }

    void checkOrganisation();

    return () => {
      active = false;
    };
  }, [attempt]);

  // Permissions can change server-side at any time; re-read the role when the tab
  // regains focus so the UI doesn't keep offering actions the API will now refuse.
  const organisationId = state.status === 'allowed' ? state.organisation.id : null;

  const refreshRole = useCallback(async () => {
    if (!organisationId) {
      return;
    }
    try {
      const role = await fetchRole(organisationId);

      setState((current) =>
        current.status === 'allowed' && current.role !== role ? { ...current, role } : current,
      );
    } catch {
      // Removed from the organisation: re-run the whole membership check.
      setAttempt((value) => value + 1);
    }
  }, [organisationId]);

  useEffect(() => {
    if (!organisationId) {
      return;
    }
    const onFocus = () => void refreshRole();

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [organisationId, refreshRole]);

  const contextValue = useMemo<OrganisationContextValue | null>(() => {
    if (state.status !== 'allowed') {
      return null;
    }
    const { organisation, role } = state;

    return {
      organisation,
      role,
      refreshRole,
      leaveOrganisation: async () => {
        const result = await authClient.organization.leave({
          organizationId: organisation.id,
        });

        if (result.error) {
          throw new Error(result.error.message || 'Unable to leave the organisation.');
        }
        setAttempt((value) => value + 1);
      },
    };
  }, [state, refreshRole]);

  if (state.status === 'loading') {
    return <LoadingState label="Checking organisation membership…" variant="fullscreen" />;
  }

  if (state.status === 'error') {
    return <ErrorState title="We couldn't check your access" message={state.message} variant="fullscreen" />;
  }

  if (state.status === 'no-organisation') {
    return <Navigate to="/organisation/setup" replace />;
  }

  if (!contextValue) {
    return null;
  }

  return (
    <organisationContext.Provider value={contextValue}>
      <Outlet />
    </organisationContext.Provider>
  );
}
