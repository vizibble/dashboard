import { formatTimestamp, formatValue } from '@/app/pages/dashboards/shared/lib/format';
import type { WidgetViewProps } from '@/app/pages/dashboards/shared/widgets/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/shared/components/ui/tooltip';

const PALETTE = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)'];

/**
 * One row per device. A reported state lasts until the next reading. After the last
 * reading nothing is drawn, because we don't know how long the state lasted.
 */
export function StateWidget({ presentation, result }: WidgetViewProps) {
  const from = result.range.from.getTime();
  const span = result.range.to.getTime() - from || 1;
  const tz = result.range.timezone;

  const colorFor = (() => {
    const seen = new Map<string, string>();
    return (value: string | number | boolean | null) => {
      if (value === true) return presentation.color ?? 'var(--chart-1)';
      if (value === false) return 'var(--muted-foreground)';
      const key = String(value);
      if (!seen.has(key)) seen.set(key, PALETTE[seen.size % PALETTE.length]!);
      return seen.get(key)!;
    };
  })();

  const legend = new Map<string, string>();

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      {result.series.map((series) => {
        const points = series.points.filter((point) => point.value !== null);
        return (
          <div key={series.device_id ?? 'all'} className="min-w-0">
            {result.series.length > 1 && (
              <p className="text-muted-foreground mb-1 truncate text-xs">{series.device_name}</p>
            )}
            <div className="bg-muted/60 relative h-5 overflow-hidden rounded-sm">
              {points.map((point, index) => {
                const next = points[index + 1];
                const start = (point.t.getTime() - from) / span;
                const end = next ? (next.t.getTime() - from) / span : start + 0.004;
                const label = formatValue(point.value, result.metric, presentation);
                const color = colorFor(point.value);
                legend.set(label, color);
                return (
                  <Tooltip key={point.t.getTime()}>
                    <TooltipTrigger asChild>
                      <span
                        className="absolute inset-y-0"
                        style={{
                          left: `${Math.max(0, start) * 100}%`,
                          width: `${Math.max(0.3, (Math.min(1, end) - Math.max(0, start)) * 100)}%`,
                          background: color,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {label} · {formatTimestamp(point.t, tz)}
                      {next ? ` – ${formatTimestamp(next.t, tz)}` : ' (last reading)'}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        );
      })}
      {presentation.show_legend && legend.size > 0 && (
        <ul className="text-muted-foreground mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {[...legend].map(([label, color]) => (
            <li key={label} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-sm" style={{ background: color }} />
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
