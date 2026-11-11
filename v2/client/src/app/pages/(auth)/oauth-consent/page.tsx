import { ShieldCheckIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { authClient } from '@/app/pages/(auth)/client';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { LoadingState } from '@/app/shared/components/states/loading-state';
import { Button } from '@/app/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/shared/components/ui/card';

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'vizibble:read': 'Read your organisations, locations, devices, telemetry and dashboards, limited by your role.',
  openid: 'Confirm your identity.',
  profile: 'Access your name.',
  email: 'Access your email address.',
  offline_access: 'Maintain access until you disconnect the integration.',
};

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

  const client = useQuery({
    queryKey: ['oauth-client', clientId],
    queryFn: async () => {
      const result = await authClient.oauth2.publicClient({
        query: { client_id: clientId },
      });

      if (result.error || !result.data) {
        throw new Error(result.error?.message ?? 'Unable to identify this application.');
      }

      return result.data;
    },
    enabled: Boolean(clientId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const respond = async (accept: boolean) => {
    if (submitting !== null) return;

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
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try connecting again.');
      setSubmitting(null);
    }
  };

  if (!clientId) {
    return (
      <ErrorState
        variant="fullscreen"
        title="Invalid request"
        message="This request is missing the application ID. Start connecting again from the app."
      />
    );
  }

  if (client.isPending) {
    return <LoadingState variant="fullscreen" label="Loading" />;
  }

  if (client.isError || !client.data) {
    return (
      <ErrorState
        variant="fullscreen"
        title="Unknown application"
        message="This application isn't registered with Vizibble or the connection request has expired."
      />
    );
  }

  const applicationName = client.data.client_name ?? 'An application';

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheckIcon className="size-5" aria-hidden="true" />
            {applicationName} wants to connect to Vizibble
          </CardTitle>

          <CardDescription>Review the permissions this application is requesting.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {readScopes.length > 0 ? (
              readScopes.map((scope) => <li key={scope}>{SCOPE_DESCRIPTIONS[scope] ?? scope}</li>)
            ) : (
              <li>No additional read permissions requested.</li>
            )}
          </ul>

          {wantsWrite && (
            <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <input
                id="allow-write-access"
                type="checkbox"
                className="mt-0.5 size-4 shrink-0"
                checked={allowWrite}
                onChange={(event) => setAllowWrite(event.target.checked)}
                disabled={submitting !== null}
              />

              <label
                htmlFor="allow-write-access"
                className="cursor-pointer space-y-1"
              >
                <span className="block font-medium">
                  Also allow it to make changes
                </span>

                <span className="text-muted-foreground block">
                  Create, edit and delete locations, devices, templates and dashboards,
                  subject to your organisation role.
                </span>
              </label>
            </div>
          )}

          <p className="text-muted-foreground text-sm">
            {allowWrite
              ? 'This application will receive the requested read and write permissions.'
              : 'This application will not receive write permission.'}{' '}
            You can disconnect it at any time in Integrations.
          </p>

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" disabled={submitting !== null} onClick={() => void respond(false)}>
            Deny
          </Button>

          <Button
            type="button"
            disabled={submitting !== null}
            loading={submitting === 'allow'}
            onClick={() => void respond(true)}
          >
            Allow
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
