import { ArrowDownRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react';

import { formatRelative, formatValue, thresholdColor } from '@/app/pages/dashboards/shared/lib/format';
import type { SummaryValue } from '@/app/pages/dashboards/shared/types';
import type { WidgetViewProps } from '@/app/pages/dashboards/shared/widgets/types';
import { cn } from '@/app/shared/utils/cn';

/** One headline number, or a compact list when the widget is split by device. */
export function KpiWidget({ presentation, result }: WidgetViewProps) {
  if (result.values.length > 1) {
    return (
      <ul className="-mx-1 flex h-full flex-col gap-0.5 overflow-y-auto">
        {result.values.map((item) => (
          <li
            key={item.device_id ?? 'all'}
            className="hover:bg-muted/60 flex items-baseline justify-between gap-3 rounded px-1 py-1 text-sm"
          >
            <span className="text-muted-foreground truncate">{item.device_name}</span>
            <span
              className="shrink-0 font-medium tabular-nums"
              style={{ color: colorOf(item, presentation) ?? undefined }}
            >
              {formatValue(item.value, result.metric, presentation)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const item = result.values[0];

  const value = item?.value ?? null;

  const delta =
    typeof value === 'number' && typeof item?.previous === 'number' ? value - item.previous : null;

  return (
    <div className="flex h-full flex-col justify-center gap-1">
      <p
        className="text-foreground text-3xl font-semibold tracking-tight tabular-nums"
        style={{
          color: (item && colorOf(item, presentation)) ?? presentation.color ?? undefined,
        }}
      >
        {formatValue(value, result.metric, presentation)}
      </p>
      <KpiFooter item={item} delta={delta} presentation={presentation} metric={result.metric} />
    </div>
  );
}

type KpiFooterProps = {
  item: SummaryValue | undefined;
  delta: number | null;
  presentation: WidgetViewProps['presentation'];
  metric: WidgetViewProps['result']['metric'];
};

/** Change from the previous period, else when the reading arrived, else why there's no comparison. */
function KpiFooter({ item, delta, presentation, metric }: KpiFooterProps) {
  if (delta !== null) {
    return (
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 font-medium tabular-nums',
            delta > 0 && 'text-emerald-700 dark:text-emerald-400',
            delta < 0 && 'text-amber-700 dark:text-amber-400',
          )}
        >
          {delta > 0 && <ArrowUpRightIcon size={12} weight="bold" aria-hidden="true" />}
          {delta < 0 && <ArrowDownRightIcon size={12} weight="bold" aria-hidden="true" />}
          {formatValue(Math.abs(delta), metric, presentation)}
        </span>
        vs previous period
      </p>
    );
  }
  if (item?.t) {
    return <p className="text-muted-foreground text-xs">Updated {formatRelative(item.t)}</p>;
  }
  if (item && item.previous === null && item.value !== null) {
    return <p className="text-muted-foreground text-xs">No readings in the previous period</p>;
  }

  return null;
}

function colorOf(item: SummaryValue, presentation: WidgetViewProps['presentation']) {
  return typeof item.value === 'number' ? thresholdColor(item.value, presentation.thresholds) : null;
}
