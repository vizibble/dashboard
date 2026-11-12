import { useSearchParams } from 'react-router-dom';

import type { Dashboard } from '@/app/pages/dashboards/shared/types';

const PARAM = 'dashboard';

/** The open dashboard lives in the URL: the requested one, else the default, else the first. */
export function useDashboardSelection(dashboards: Dashboard[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedId = searchParams.get(PARAM);

  const selectedId =
    dashboards.find((item) => item.id === requestedId)?.id ??
    dashboards.find((item) => item.is_default)?.id ??
    dashboards[0]?.id;

  const select = (dashboardId: string) =>
    setSearchParams(
      (params) => {
        params.set(PARAM, dashboardId);

        return params;
      },
      { replace: true },
    );

  const clear = () =>
    setSearchParams(
      (params) => {
        params.delete(PARAM);

        return params;
      },
      { replace: true },
    );

  return { selectedId, select, clear };
}
