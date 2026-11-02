import { useRef, useMemo } from 'react';
import type ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

import { LineChart } from '@/components/line-chart';
import { ChartContainer } from '@/pages/home/components/chart-container';
import { ChartHeader } from '@/pages/home/components/chart-header';
import { useChartResize } from '@/pages/home/hooks/chart-resize';
import { useFullscreen } from '@/pages/home/hooks/fullscreen';
import { downloadChart } from '@/pages/home/utils/download-chart';

const STATE_COLORS = {
  active: '#22c55e',
  idle: '#eab308',
  offline: '#ef4444',
};

const STATE_LABELS = {
  active: 'Active',
  idle: 'Idle',
  offline: 'Offline',
};

interface NodeStatusChartProps {
  statusData: [string, number, number, string?][];
  summary: {
    activeMinutes: number;
    idleMinutes: number;
    offlineMinutes: number;
    totalStops: number;
  };
  targetDate?: Date;
}

function buildSegments(statusData: [string, number, number, string?][]) {
  if (statusData.length === 0) return [];

  type Segment = {
    start: number;
    end: number;
    state: 'active' | 'idle' | 'offline';
    reason: string;
  };
  const segments: Segment[] = [];

  const stateOf = (code: number): Segment['state'] =>
    code === 1 ? 'active' : code === 0 ? 'idle' : 'offline';

  let segStart = new Date(statusData[0][0]).getTime();
  let segState = stateOf(statusData[0][2]);
  let segReason = statusData[0][3] || '';

  for (let i = 1; i < statusData.length; i++) {
    const t = new Date(statusData[i][0]).getTime();
    const s = stateOf(statusData[i][2]);
    const r = statusData[i][3] || '';

    if (s !== segState || r !== segReason) {
      segments.push({
        start: segStart,
        end: t,
        state: segState,
        reason: segReason,
      });
      segStart = t;
      segState = s;
      segReason = r;
    }
  }

  const lastT = new Date(statusData[statusData.length - 1][0]).getTime() + 60_000;
  segments.push({
    start: segStart,
    end: lastT,
    state: segState,
    reason: segReason,
  });

  return segments;
}

export const NodeStatusChart = ({
  statusData,
  summary,
  targetDate,
}: NodeStatusChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const { isFullscreen, toggle } = useFullscreen();
  useChartResize(chartRef);

  const segments = useMemo(() => buildSegments(statusData), [statusData]);

  const [axisMin, axisMax] = useMemo(() => {
    const now = new Date();
    const isLive = !targetDate || targetDate.toDateString() === now.toDateString();
    const base = targetDate ?? now;
    const operationalDate = new Date(base);

    if (isLive && now.getHours() < 8) {
      operationalDate.setDate(operationalDate.getDate() - 1);
    }

    const startTimeLocal = new Date(operationalDate);
    startTimeLocal.setHours(8, 0, 0, 0);
    const startMs = startTimeLocal.getTime();

    if (isLive) {
      now.setSeconds(0, 0);
      const currentMax = Math.min(now.getTime(), startMs + 24 * 3600 * 1000);
      return [startMs, currentMax];
    }
    return [startMs, startMs + 24 * 3600 * 1000 - 60_000];
  }, [targetDate]);

  const options: EChartsOption = useMemo(() => {
    const customData = segments.map((seg) => [
      seg.start,
      seg.end,
      seg.state,
      seg.reason,
    ]);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { value: [number, number, string, string] };
          if (!p.value) return '';
          const [startMs, endMs, stateStr, reason] = p.value;
          const durMin = Math.round((endMs - startMs) / 60000);
          const durStr =
            durMin >= 60
              ? `${Math.floor(durMin / 60)}h ${durMin % 60}m`
              : `${durMin} min`;
          const sDate = new Date(startMs).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          const eDate = new Date(endMs).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          const color =
            STATE_COLORS[stateStr as keyof typeof STATE_COLORS] ?? '#94a3b8';
          const label =
            STATE_LABELS[stateStr as keyof typeof STATE_LABELS] ?? stateStr;

          return `
            <div style="font-family: inherit; font-size: 12px; line-height: 1.5; padding: 2px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};"></span>
                <span style="font-weight: 700; color: #1e293b;">${label}</span>
                <span style="color: #64748b;">(${durStr})</span>
              </div>
              <div style="color: #475569; font-size: 11px;">${sDate} – ${eDate}</div>
              ${reason ? `<div style="color: #334155; margin-top: 4px; font-weight: 500;">Reason: ${reason}</div>` : ''}
            </div>
          `;
        },
      },
      grid: {
        top: 16,
        bottom: 30,
        left: 20,
        right: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        min: axisMin,
        max: axisMax,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (value: number) =>
            new Date(value).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      yAxis: {
        type: 'category',
        data: ['Status'],
        show: false,
      },
      series: [
        {
          type: 'custom',
          renderItem: (_params, api) => {
            const startVal = api.value(0) as number;
            const endVal = api.value(1) as number;
            const stateStr = api.value(2) as keyof typeof STATE_COLORS;

            const startCoord = api.coord([startVal, 0]);
            const endCoord = api.coord([endVal, 0]);

            const width = Math.max(endCoord[0] - startCoord[0], 1);
            const height = 48;
            const y = startCoord[1] - height / 2;

            return {
              type: 'rect',
              shape: {
                x: startCoord[0],
                y,
                width,
                height,
                r: [3, 3, 3, 3],
              },
              style: {
                fill: STATE_COLORS[stateStr] ?? '#94a3b8',
              },
            };
          },
          data: customData,
        },
      ],
    };
  }, [segments, axisMin, axisMax]);

  return (
    <ChartContainer isFullscreen={isFullscreen}>
      <ChartHeader
        title="Machine Status per Minute"
        isFullscreen={isFullscreen}
        onDownload={() => chartRef.current && downloadChart(chartRef, 'machine-status')}
        onToggleFullscreen={toggle}
      />

      <div className={isFullscreen ? 'flex-1 p-4' : 'p-2'}>
        <LineChart
          ref={chartRef}
          height={isFullscreen ? '100%' : '140px'}
          options={options}
        />
      </div>

      {/* Summary row */}
      <footer className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-2.5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: STATE_COLORS.active }}
          />
          <span className="text-[11px] text-slate-500 font-medium">
            Active <b className="text-slate-800 font-mono">{summary.activeMinutes}m</b>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: STATE_COLORS.idle }}
          />
          <span className="text-[11px] text-slate-500 font-medium">
            Idle <b className="text-slate-800 font-mono">{summary.idleMinutes}m</b>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: STATE_COLORS.offline }}
          />
          <span className="text-[11px] text-slate-500 font-medium">
            Offline <b className="text-slate-800 font-mono">{summary.offlineMinutes}m</b>
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-slate-400 font-medium">
            Stops: <b className="text-slate-800 font-mono">{summary.totalStops}</b>
          </span>
        </div>
      </footer>
    </ChartContainer>
  );
};
