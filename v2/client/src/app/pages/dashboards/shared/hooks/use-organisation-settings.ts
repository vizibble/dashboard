import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { updateOrganisationSettings } from '@/app/pages/dashboards/shared/api';
import { analyticsQueries, organisationSettingsQueries } from '@/app/pages/dashboards/shared/queries';

/** Organisation-wide settings that dashboards depend on (the reporting timezone). */
export function useOrganisationSettings(organisationId: string) {
  const query = useQuery(organisationSettingsQueries.detail(organisationId));

  return query;
}

/** Changing the timezone moves every day/week boundary, so all analytics are refetched. */
export function useUpdateOrganisationSettings(organisationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timezone: string) => updateOrganisationSettings(organisationId, timezone),
    onSuccess: async (settings) => {
      queryClient.setQueryData(organisationSettingsQueries.detail(organisationId).queryKey, settings);
      await queryClient.invalidateQueries({ queryKey: analyticsQueries.all(organisationId) });
    },
  });
}
