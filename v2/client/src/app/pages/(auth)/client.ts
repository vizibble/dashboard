import { API_BASE_URL } from '@/app/shared/utils/config';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';
import { ac, roles } from '@vizibble/shared/permissions';
import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  basePath: '/api/v2/auth',
  // oauthProviderClient carries the signed OAuth query through sign-in and consent (AI app connections).
  plugins: [organizationClient({ ac, roles }), oauthProviderClient()],
});

type BetterAuthResult<T> = {
  data: T | null;
  error: { message?: string } | null;
};

/** Better Auth returns `{ data, error }`; callers such as react-query expect a throw on failure. */
export async function unwrap<T>(request: Promise<BetterAuthResult<T>>, fallback: string): Promise<T> {
  const { data, error } = await request;

  if (error || data === null) {
    throw new Error(error?.message || fallback);
  }

  return data;
}
