import { IconBase, type Icon, type IconWeight } from '@phosphor-icons/react';
import { forwardRef, type ReactElement, type ReactNode } from 'react';

const STROKE: Record<IconWeight, number> = {
  thin: 8,
  light: 12,
  regular: 18,
  bold: 26,
  fill: 18,
  duotone: 18,
};

const TINT_OPACITY: Partial<Record<IconWeight, number>> = {
  duotone: 0.22,
  fill: 0.4,
};

function createCustomIcon(name: string, outline: ReactNode, tint: ReactNode): Icon {
  const weights = new Map<IconWeight, ReactElement>();

  (Object.keys(STROKE) as IconWeight[]).forEach((w) => {
    weights.set(
      w,
      <>
        {TINT_OPACITY[w] !== undefined && (
          <g fill="currentColor" stroke="none" opacity={TINT_OPACITY[w]}>
            {tint}
          </g>
        )}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE[w]}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {outline}
        </g>
      </>,
    );
  });

  const Component: Icon = forwardRef((props, ref) => <IconBase ref={ref} {...props} weights={weights} />);

  Component.displayName = name;

  return Component;
}

/** Soft 4-point sparkle, the little "cute" accent. */
const Sparkle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <path
    d={`M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={6}
  />
);

/* Dashboard: pillowy tiles, mixing squares and circles */
const dashTiles = (
  <>
    <rect x="36" y="36" width="84" height="84" rx="30" />
    <circle cx="176" cy="78" r="42" />
    <circle cx="78" cy="178" r="42" />
    <rect x="136" y="136" width="84" height="84" rx="30" />
  </>
);

export const CustomDashboardIcon = createCustomIcon('CustomDashboardIcon', dashTiles, dashTiles);

/* Devices: round sensor puck sending out signal waves */
const puck = <rect x="36" y="108" width="136" height="108" rx="40" />;

export const CustomDeviceIcon = createCustomIcon(
  'CustomDeviceIcon',
  <>
    {puck}
    <circle cx="104" cy="162" r="12" fill="currentColor" stroke="none" />
    <circle cx="172" cy="84" r="10" fill="currentColor" stroke="none" />
    <path d="M172 56 A28 28 0 0 1 200 84" />
    <path d="M172 32 A52 52 0 0 1 224 84" />
  </>,
  puck,
);

/* Templates: soft UI card with a sparkle */
const card = <rect x="28" y="72" width="168" height="144" rx="36" />;

export const CustomTemplateIcon = createCustomIcon(
  'CustomTemplateIcon',
  <>
    {card}
    <circle cx="72" cy="114" r="12" fill="currentColor" stroke="none" />
    <path d="M104 114 H158" />
    <rect x="64" y="148" width="96" height="36" rx="14" />
    <Sparkle cx={210} cy={52} r={22} />
  </>,
  card,
);

/* Locations: chubby pin with a heart inside */
const pin = <path d="M128 228 C128 228 48 164 48 100 A80 80 0 0 1 208 100 C208 164 128 228 128 228 Z" />;

export const CustomLocationIcon = createCustomIcon(
  'CustomLocationIcon',
  <>
    {pin}
    <path
      d="M128 126 C100 108 92 90 100 78 C108 66 126 70 128 86 C130 70 148 66 156 78 C164 90 156 108 128 126 Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={6}
    />
  </>,
  pin,
);
