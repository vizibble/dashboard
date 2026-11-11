import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useSession } from '@/app/pages/(auth)/shared/hooks/use-session';
import type { CheckEmailState } from '@/app/pages/(auth)/shared/utils/auth-redirects';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { LoadingState } from '@/app/shared/components/states/loading-state';

export function RequireAuth() {
  const location = useLocation();
  const session = useSession();

  if (session.status === 'loading') {
    return <LoadingState label="Checking your session…" variant="fullscreen" />;
  }
  if (session.status === 'error') {
    return <ErrorState title="We couldn't get your account" message={session.error} variant="fullscreen" />;
  }
  if (session.status === 'signed-out') {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!session.emailVerified) {
    const state: CheckEmailState = { email: session.email, next: `${location.pathname}${location.search}` };
    return <Navigate to="/check-email" state={state} replace />;
  }

  return <Outlet />;
}
