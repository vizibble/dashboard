import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/app/pages/(auth)/client';

/** Public details (e.g. name) of the OAuth client requesting consent. */
export function useOAuthClient(clientId: string) {
  return useQuery({
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
}
