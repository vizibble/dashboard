import type { ComponentType } from 'react';

import type { WidgetType } from '@/app/pages/dashboards/shared/types';
import { GaugeWidget } from '@/app/pages/dashboards/shared/widgets/gauge-widget';
import { KpiWidget } from '@/app/pages/dashboards/shared/widgets/kpi-widget';
import { MapWidget } from '@/app/pages/dashboards/shared/widgets/map-widget';
import { StateWidget } from '@/app/pages/dashboards/shared/widgets/state-widget';
import { TableWidget } from '@/app/pages/dashboards/shared/widgets/table-widget';
import { TimeSeriesWidget } from '@/app/pages/dashboards/shared/widgets/time-series-widget';
import type { WidgetViewProps } from '@/app/pages/dashboards/shared/widgets/types';

/** Adding a visualisation = one component + one entry here (plus its type in the shared contract). */
export const WIDGET_COMPONENTS: Record<WidgetType, ComponentType<WidgetViewProps>> = {
  kpi: KpiWidget,
  line: TimeSeriesWidget,
  area: TimeSeriesWidget,
  bar: TimeSeriesWidget,
  gauge: GaugeWidget,
  state: StateWidget,
  table: TableWidget,
  map: MapWidget,
};
