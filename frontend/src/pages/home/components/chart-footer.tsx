import type { EChartsOption, SeriesOption } from 'echarts';

import type { SeriesStats } from '@/pages/home/utils/get-series-stats';

type Props = {
  stats: SeriesStats;
  options: EChartsOption;
};

export const ChartFooter = ({ stats, options }: Props) => {
  const rawSeries = options?.series;

  const series: SeriesOption | undefined = Array.isArray(rawSeries)
    ? rawSeries[0]
    : rawSeries;

  const seriesName =
    series && 'name' in series && typeof series.name === 'string'
      ? series.name
      : 'Value';

  const seriesColor =
    series &&
    'itemStyle' in series &&
    series.itemStyle &&
    typeof series.itemStyle === 'object' &&
    'color' in series.itemStyle
      ? ((series.itemStyle as { color?: string }).color ?? '#2563eb')
      : '#2563eb';

  return (
    <footer className="flex flex-col xs:flex-row items-start xs:items-center gap-2 sm:gap-3 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100">
      {/* Series label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
          style={{ backgroundColor: seriesColor }}
        />
        <span className="text-slate-500 font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-tight">
          {seriesName}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-[11px] md:text-[12px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-slate-400">Min:</span>
          <span className="text-red-500 bg-red-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-red-100 font-mono tabular-nums">
            {stats.min.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-slate-400">Max:</span>
          <span className="text-emerald-500 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-emerald-100 font-mono tabular-nums">
            {stats.max.toFixed(2)}
          </span>
        </div>
      </div>
    </footer>
  );
};
