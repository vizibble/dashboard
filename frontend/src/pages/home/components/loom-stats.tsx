import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ShiftSummary {
  name: string;
  production: number;
  utilization: number;
  hours: number;
  activeMinutes: number;
  idleMinutes: number;
  offlineMinutes: number;
}

interface LoomStatsProps {
  summary: {
    totalProduction: number;
    avgSpeed: number;
    utilization: number;
    activeMinutes: number;
    idleMinutes: number;
    offlineMinutes: number;
    shifts: ShiftSummary[];
    currentShiftIndex: number;
  };
  isHistory?: boolean;
}

/* ─────────────────────────────────────────────
   Donut SVG
───────────────────────────────────────────── */
const Donut = ({
  pct,
  color = '#1976d2',
  size = 88,
  stroke = 8,
}: {
  pct: number;
  color?: string;
  size?: number;
  stroke?: number;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8edf2" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
};

/* ─────────────────────────────────────────────
   Progress Bar
───────────────────────────────────────────── */
const Bar = ({ pct, color, label }: { pct: number; color: string; label?: string }) => (
  <div className="w-full">
    {label && (
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#90a0b7]">{label}</span>
        <span className="text-[10px] font-bold text-[#1c2b4b] tabular-nums">{pct}%</span>
      </div>
    )}
    <div className="h-2 w-full bg-[#e8edf2] rounded-sm overflow-hidden">
      <div
        className="h-full rounded-sm transition-all duration-1000 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Metric Cell — stacked label + value, coloured accent bar
───────────────────────────────────────────── */
const Cell = ({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent: string;
}) => (
  <div className="flex flex-col justify-between px-4 py-3 h-full">
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#90a0b7]">{label}</span>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-bold tabular-nums leading-none text-[#1c2b4b]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      {unit && <span className="text-[11px] font-semibold text-[#90a0b7]">{unit}</span>}
    </div>
    <div className="mt-2 h-[3px] w-8 rounded-full" style={{ backgroundColor: accent }} />
  </div>
);

/* ─────────────────────────────────────────────
   Shared card layout used by both Daily + Shift
   ┌─────────────────┬──────────────┬─────────────────┐
   │  Production     │  OEE donut   │  Active         │
   │  + target bar   │              │  Idle           │
   │                 │              │  Offline        │
   └─────────────────┴──────────────┴─────────────────┘
───────────────────────────────────────────── */
interface CardBodyProps {
  productionLabel: string;
  production: number;
  target: number;
  oee: number;
  activeMinutes: number;
  idleMinutes: number;
  offlineMinutes: number;
  compact?: boolean;
}

const CardBody = ({
  productionLabel,
  production,
  target,
  oee,
  activeMinutes,
  idleMinutes,
  offlineMinutes,
  compact = false,
}: CardBodyProps) => {
  const pct = Math.min(100, Math.round((production / target) * 100));
  const barColor = pct >= 80 ? '#43a047' : pct >= 50 ? '#fb8c00' : '#e53935';

  const stats = [
    { label: 'Active Time',  value: activeMinutes,  unit: 'min', accent: '#43a047' },
    { label: 'Idle Time',    value: idleMinutes,    unit: 'min', accent: '#fb8c00' },
    { label: 'Offline Time', value: offlineMinutes, unit: 'min', accent: '#e53935' },
  ];

  /* ── Compact: vertical stack (for narrow history cards) ── */
  if (compact) {
    return (
      <div className="flex flex-col divide-y divide-[#e8edf2]">
        {/* Row 1 — Production + bar */}
        <div className="flex flex-col px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#90a0b7]">
            {productionLabel}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-bold tabular-nums leading-none text-[#1c2b4b]">
              {production.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#90a0b7]">/ {target} m</span>
          </div>
          <div className="mt-3">
            <Bar pct={pct} color={barColor} label="Target" />
          </div>
        </div>

        {/* Row 2 — OEE donut + status cells */}
        <div className="flex divide-x divide-[#e8edf2]">
          {/* Donut */}
          <div className="flex items-center justify-center px-4 py-3">
            <div className="relative flex items-center justify-center">
              <Donut pct={oee} size={68} stroke={6} />
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-bold tabular-nums text-[#1c2b4b] leading-none">{oee}%</span>
                <span className="text-[8px] font-semibold uppercase text-[#90a0b7] tracking-wide mt-0.5">OEE</span>
              </div>
            </div>
          </div>
          {/* Status cells */}
          <div className="flex-1 grid grid-cols-3 divide-x divide-[#e8edf2]">
            {stats.map(({ label, value, unit, accent }) => (
              <div key={label} className="flex flex-col justify-between px-3 py-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#90a0b7] leading-tight">{label}</span>
                <div className="flex items-baseline gap-0.5 mt-1">
                  <span className="text-base font-bold tabular-nums leading-none text-[#1c2b4b]">{value}</span>
                  <span className="text-[10px] font-semibold text-[#90a0b7]">{unit}</span>
                </div>
                <div className="mt-1.5 h-[3px] w-6 rounded-full" style={{ backgroundColor: accent }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Default: 3-column side-by-side (for full-width daily/shift cards) ── */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] divide-y sm:divide-y-0 sm:divide-x divide-[#e8edf2]">

      {/* Col 1 — Production + bar */}
      <div className="flex flex-col px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#90a0b7]">
          {productionLabel}
        </span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-4xl sm:text-5xl font-bold tabular-nums leading-none text-[#1c2b4b]">
            {production.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-[#90a0b7]">/ {target} m</span>
        </div>
        <div className="mt-3">
          <Bar pct={pct} color={barColor} label="Target" />
        </div>
      </div>

      {/* Col 2 — OEE donut */}
      <div className="flex items-center justify-center py-4 px-6">
        <div className="relative flex items-center justify-center">
          <Donut pct={oee} size={88} stroke={8} />
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold tabular-nums text-[#1c2b4b] leading-none">{oee}%</span>
            <span className="text-[9px] font-semibold uppercase text-[#90a0b7] tracking-wide mt-0.5">OEE</span>
          </div>
        </div>
      </div>

      {/* Col 3 — Active / Idle / Offline */}
      <div className="grid grid-cols-3 sm:grid-cols-1 sm:divide-y divide-x sm:divide-x-0 divide-[#e8edf2]">
        {stats.map(({ label, value, unit, accent }) => (
          <Cell key={label} label={label} value={value} unit={unit} accent={accent} />
        ))}
      </div>

    </div>
  );
};

/* ─────────────────────────────────────────────
   Section Header
───────────────────────────────────────────── */
const SectionHeader = ({
  title,
  meta,
  active,
}: {
  title: string;
  meta?: string;
  active?: boolean;
}) => (
  <div
    className={cn(
      'flex items-center justify-between px-4 py-2.5 border-b border-[#e8edf2]',
      active ? 'bg-[#1976d2]' : 'bg-[#f5f7fa]'
    )}
  >
    <span className={cn('text-[11px] font-bold uppercase tracking-[0.14em]', active ? 'text-white' : 'text-[#546e7a]')}>
      {title}
    </span>
    {meta && (
      <span className={cn('text-[11px] font-bold tabular-nums', active ? 'text-white/70' : 'text-[#90a0b7]')}>
        {meta}
      </span>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   Context Row
───────────────────────────────────────────── */
const ContextRow = () => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2 bg-white border border-[#e8edf2] rounded text-[11px]">
    <span className="text-[#90a0b7] font-semibold uppercase tracking-[0.12em]">Product</span>
    <span className="font-bold text-[#1c2b4b]">125 mm</span>
    <div className="hidden sm:block w-px h-3 bg-[#e8edf2]" />
    <span className="text-[#90a0b7] font-semibold uppercase tracking-[0.12em]">Operator</span>
    <span className="font-bold text-[#1c2b4b]">Santosh</span>
  </div>
);

/* ─────────────────────────────────────────────
   Main Export
───────────────────────────────────────────── */
export const LoomStats = ({ summary, isHistory }: LoomStatsProps) => {
  const target = 500;
  const activeShift = summary.shifts[summary.currentShiftIndex];

  /* ── Historical layout ── */
  if (isHistory) {
    return (
      <div className="space-y-3">
        <ContextRow />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.shifts.map((s, i) => (
            <div key={i} className="bg-white border border-[#e8edf2] rounded overflow-hidden">
              <SectionHeader title={s.name} meta={`${s.hours} hr`} />
              <CardBody
                productionLabel="Output"
                production={s.production}
                target={target}
                oee={s.utilization}
                activeMinutes={s.activeMinutes}
                idleMinutes={s.idleMinutes}
                offlineMinutes={s.offlineMinutes}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Live dashboard layout ── */
  return (
    <div className="space-y-3">

      <ContextRow />

      {/* Daily Overview */}
      <div className="bg-white border border-[#e8edf2] rounded overflow-hidden">
        <SectionHeader title="Daily Overview" meta="Today" />
        <CardBody
          productionLabel="Output"
          production={summary.totalProduction}
          target={target * 3}
          oee={summary.utilization}
          activeMinutes={summary.activeMinutes}
          idleMinutes={summary.idleMinutes}
          offlineMinutes={summary.offlineMinutes}
        />
      </div>

      {/* Current Shift */}
      <div className="bg-white border border-[#e8edf2] rounded overflow-hidden">
        <SectionHeader
          title={activeShift.name}
          meta={`${activeShift.hours} hr`}
        />
        <CardBody
          productionLabel="Output"
          production={activeShift.production}
          target={target}
          oee={activeShift.utilization}
          activeMinutes={activeShift.activeMinutes}
          idleMinutes={activeShift.idleMinutes}
          offlineMinutes={activeShift.offlineMinutes}
        />
      </div>

    </div>
  );
};
