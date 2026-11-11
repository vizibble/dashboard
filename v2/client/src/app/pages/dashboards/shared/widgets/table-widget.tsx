import { formatTimestamp, formatValue } from '@/app/pages/dashboards/shared/lib/format';
import type { WidgetViewProps } from '@/app/pages/dashboards/shared/widgets/types';

/** Latest reading per device, or individual readings newest first. */
export function TableWidget({ presentation, result }: WidgetViewProps) {
  const tz = result.range.timezone;
  const rows =
    presentation.aggregation === 'latest'
      ? result.values.map((value) => ({
          key: value.device_id ?? 'all',
          device: value.device_name,
          t: value.t,
          value: value.value,
        }))
      : result.series
          .flatMap((series) =>
            series.points.map((point) => ({
              key: `${series.device_id}-${point.t.getTime()}`,
              device: series.device_name,
              t: point.t,
              value: point.value,
            })),
          )
          .sort((a, b) => (b.t?.getTime() ?? 0) - (a.t?.getTime() ?? 0))
          .slice(0, 200);

  return (
    <div className="-mx-4 h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-card text-muted-foreground sticky top-0 text-left text-xs">
          <tr className="border-b">
            <th className="px-4 py-1.5 font-medium">Device</th>
            <th className="px-2 py-1.5 font-medium">Time</th>
            <th className="px-4 py-1.5 text-right font-medium">{result.metric?.label ?? 'Value'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b last:border-0">
              <td className="max-w-40 truncate px-4 py-1.5">{row.device}</td>
              <td className="text-muted-foreground px-2 py-1.5 whitespace-nowrap tabular-nums">
                {row.t ? formatTimestamp(row.t, tz) : 'No readings'}
              </td>
              <td className="px-4 py-1.5 text-right font-medium whitespace-nowrap tabular-nums">
                {formatValue(row.value, result.metric, presentation)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
