import { LockKeyIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { authClient } from '@/app/pages/(auth)/client';
import { useOAuthClient } from '@/app/pages/(auth)/oauth-consent/hooks/use-oauth-client';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { LoadingState } from '@/app/shared/components/states/loading-state';
import { Button } from '@/app/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/shared/components/ui/card';
import { getErrorMessage } from '@/app/shared/utils/error-message';

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'vizibble:read': 'View information and data within your organisation, subject to your assigned role.',
  openid: 'Verify your identity when signing in.',
  profile: 'Access your basic profile information.',
  email: 'Access your email address.',
  offline_access: 'Maintain access when you are not actively using the application.',
};

function getScopeLabel(scope: string) {
  if (scope === 'vizibble:read') {
    return 'Read access';
  }
  if (scope === 'offline_access') {
    return 'Persistent access';
  }
  if (scope === 'openid') {
    return 'Identity verification';
  }
  if (scope === 'profile') {
    return 'Profile information';
  }
  if (scope === 'email') {
    return 'Email address';
  }

  return scope;
}

const WRITE_SCOPE = 'vizibble:write';

type ConsentAction = 'allow' | 'deny';

export function OAuthConsentPage() {
  const [searchParams] = useSearchParams();

  const clientId = searchParams.get('client_id') ?? '';

  const requestedScopes = (searchParams.get('scope') ?? '').split(/\s+/).filter(Boolean);

  const wantsWrite = requestedScopes.includes(WRITE_SCOPE);

  const readScopes = requestedScopes.filter((scope) => scope !== WRITE_SCOPE);

  const [allowWrite, setAllowWrite] = useState(false);

  const [submitting, setSubmitting] = useState<ConsentAction | null>(null);

  const [error, setError] = useState<string | null>(null);

  const client = useOAuthClient(clientId);

  const respond = async (accept: boolean) => {
    if (submitting !== null) {
      return;
    }
    setSubmitting(accept ? 'allow' : 'deny');
    setError(null);
    try {
      const grantedScopes = allowWrite ? requestedScopes : readScopes;

      const result = await authClient.oauth2.consent({
        accept,
        scope: grantedScopes.join(' '),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try connecting again.'));
      setSubmitting(null);
    }
  };

  if (!clientId) {
    return (
      <ErrorState
        variant="fullscreen"
        title="Invalid authorization request"
        message="The application ID is missing. Return to the application and start the connection process again."
      />
    );
  }

  if (client.isPending) {
    return <LoadingState variant="fullscreen" label="Loading authorization" />;
  }

  if (client.isError || !client.data) {
    return (
      <ErrorState
        variant="fullscreen"
        title="Unable to verify application"
        message="This application is not registered with Vizibble or the authorization request has expired."
      />
    );
  }

  const applicationName = client.data.client_name ?? 'Unknown application';

  return (
    <main className="bg-muted/30 relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.07),transparent_60%)]" />

      <div className="relative w-full max-w-110 space-y-6">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="bg-background mx-auto flex size-12 items-center justify-center rounded-2xl border shadow-sm">
            <ShieldCheckIcon className="text-primary size-6" weight="duotone" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Authorize application</h1>
            <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
              Review the requested permissions before allowing this application to access your Vizibble
              account.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden shadow-sm">
          {/* Application identity */}
          <CardHeader className="bg-muted/20 border-b px-5 py-5">
            <CardDescription className="text-xs font-medium tracking-wider uppercase">
              Requesting application
            </CardDescription>
            <CardTitle className="text-lg font-semibold wrap-break-word">{applicationName}</CardTitle>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This application is requesting access to information associated with your Vizibble account.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-5 py-5">
            {/* Read permissions */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Requested permissions</h2>
                <span className="text-muted-foreground text-xs">
                  {readScopes.length} {readScopes.length === 1 ? 'permission' : 'permissions'}
                </span>
              </div>
              {readScopes.length > 0 ? (
                <ul className="divide-y rounded-lg border">
                  {readScopes.map((scope) => (
                    <li key={scope} className="flex items-start gap-3 px-3.5 py-3">
                      <div className="bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md">
                        <LockKeyIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">{getScopeLabel(scope)}</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {SCOPE_DESCRIPTIONS[scope] ?? 'Access to the requested resource.'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="bg-muted/20 text-muted-foreground rounded-lg border px-3.5 py-3 text-sm">
                  No additional read permissions requested.
                </p>
              )}
            </section>
            {/* Optional write permissions */}
            {wantsWrite && (
              <section className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold">Additional permissions</h2>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    This application has also requested permission to modify information.
                  </p>
                </div>
                <div className="hover:bg-muted/30 flex items-start gap-3 rounded-lg border p-3.5 transition-colors">
                  <input
                    id="allow-write-access"
                    type="checkbox"
                    className="accent-primary mt-0.5 size-4 shrink-0"
                    checked={allowWrite}
                    onChange={(event) => setAllowWrite(event.target.checked)}
                    disabled={submitting !== null}
                    aria-describedby="allow-write-description"
                  />
                  <div className="min-w-0 space-y-1">
                    <label htmlFor="allow-write-access" className="cursor-pointer text-sm font-medium">
                      Allow modification access
                    </label>
                    <p id="allow-write-description" className="text-muted-foreground text-xs leading-relaxed">
                      Allow the application to create, update, and delete information within your
                      organisation, subject to your assigned role.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {allowWrite
                    ? 'Read and write permissions will be granted.'
                    : 'Only read and identity permissions will be granted.'}
                </p>
              </section>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-3.5 py-3 text-sm"
              >
                {error}
              </div>
            )}

            {/* Security information */}
            <div className="flex items-start gap-2.5 border-t pt-4">
              <ShieldCheckIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="text-muted-foreground text-xs leading-relaxed">
                Your access is governed by your organisation`&apos;`s permissions. You can revoke this
                application`&apos;`s access at any time from your account settings.
              </p>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/20 flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={submitting !== null}
              onClick={() => void respond(false)}
            >
              {submitting === 'deny' ? 'Declining...' : 'Deny access'}
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={submitting !== null}
              loading={submitting === 'allow'}
              onClick={() => void respond(true)}
            >
              Authorize application
            </Button>
          </CardFooter>
        </Card>
        <p className="text-muted-foreground text-center text-xs">Secure authorization powered by Vizibble</p>
      </div>
    </main>
  );
}
