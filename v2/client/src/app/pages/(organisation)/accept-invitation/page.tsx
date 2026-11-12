import { Link, useSearchParams } from 'react-router-dom';

import { useAcceptInvitation } from '@/app/pages/(organisation)/accept-invitation/hooks/use-accept-invitation';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { LoadingState } from '@/app/shared/components/states/loading-state';
import { Button } from '@/app/shared/components/ui/button';

export function AcceptInvitation() {
  const [searchParams] = useSearchParams();

  const invitationId = searchParams.get('id');

  const { state } = useAcceptInvitation(invitationId);

  if (state.status === 'checking') {
    return <LoadingState label="Checking your sign-in status…" variant="fullscreen" />;
  }
  if (state.status === 'accepting') {
    return <LoadingState label="Accepting your invitation…" variant="inline" />;
  }
  if (state.status === 'error') {
    return <ErrorState message={state.message} title="Unable to process invitation" variant="inline" />;
  }

  if (state.status === 'authentication-required') {
    const authQuery = invitationId ? `?invitationId=${encodeURIComponent(invitationId)}` : '';

    return (
      <main className="flex items-center justify-center px-5">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Accept your invitation</h1>
          <p className="text-muted-foreground text-sm">
            Sign in or create an account using the email address that received this invitation.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to={`/login${authQuery}`}>Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/signup${authQuery}`}>Create an account</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Successful acceptance navigates away from this page.
  return null;
}
