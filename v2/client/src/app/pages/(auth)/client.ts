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
