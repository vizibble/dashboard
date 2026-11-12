import type { TimeRange } from '@vizibble/shared/dashboards';

export type {
  AnalyticsQuery,
  AnalyticsResult,
  DeviceStatus,
  DeviceStatusList,
  DiscoveredMetric,
  MetricInfo,
  MissingDevice,
  Series,
  SummaryValue,
} from '@vizibble/shared/analytics';
export type {
  Aggregation,
  BucketSize,
  CreateDashboardInput,
  Dashboard,
  DashboardDetail,
  DashboardScope,
  MetricDataType,
  TimeRange,
  UpdateDashboardInput,
  Widget,
  WidgetInput,
  WidgetLayoutInput,
  WidgetThreshold,
  WidgetType,
} from '@vizibble/shared/dashboards';
export type { OrganisationSettings } from '@vizibble/shared/settings';

/** Where a dashboard lives. Organisation dashboards have no target. */
export type DashboardTarget =
  | { scope: 'organisation' }
  | { scope: 'location'; locationId: string }
  | { scope: 'device'; deviceId: string };

/** Filters chosen in the dashboard bar. They apply to every widget that doesn't override them. */
export type DashboardFilters = {
  timeRange: TimeRange;
  timeFrom: string | null;
  timeTo: string | null;
  locationId: string | null;
  deviceId: string | null;
};
