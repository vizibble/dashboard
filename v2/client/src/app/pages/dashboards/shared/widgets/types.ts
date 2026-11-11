import type { AnalyticsResult, Widget } from '@/app/pages/dashboards/shared/types';

/** Presentation settings a widget reads. Widgets never see the query or the database. */
export type WidgetPresentation = Pick<
  Widget,
  | 'title'
  | 'type'
  | 'aggregation'
  | 'decimals'
  | 'show_unit'
  | 'show_legend'
  | 'color'
  | 'min_value'
  | 'max_value'
  | 'true_label'
  | 'false_label'
  | 'thresholds'
>;

/** The one contract every visualisation implements. */
export type WidgetViewProps = {
  presentation: WidgetPresentation;
  result: AnalyticsResult;
};

/** True when the result has at least one real value to draw. */
export function hasValues(result: AnalyticsResult) {
  return (
    result.values.some((value) => value.value !== null) ||
    result.series.some((series) => series.points.some((point) => point.value !== null))
  );
}
