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
        <g fill="none" stroke="currentColor" strokeWidth={STROKE[w]} strokeLinecap="round" strokeLinejoin="round">
          {outline}
        </g>
      </>,
    );
  });

  const Component: Icon = forwardRef((props, ref) => <IconBase ref={ref} {...props} weights={weights} />);
  Component.displayName = name;
  return Component;
}

/** Container Icon: Soft rounded industrial hierarchy container folder with nested compartments */
const containerBody = (
  <path d="M40 76 C40 60 52 48 68 48 H104 C116 48 126 56 132 66 L140 80 H188 C204 80 216 92 216 108 V188 C216 204 204 216 188 216 H68 C52 216 40 204 40 188 Z" />
);

export const CustomContainerIcon = createCustomIcon(
  'CustomContainerIcon',
  <>
    {containerBody}
    {/* Inner shelf partition */}
    <path d="M40 116 H216" />
    <circle cx="84" cy="166" r="12" fill="currentColor" stroke="none" />
    <circle cx="128" cy="166" r="12" fill="currentColor" stroke="none" />
    <circle cx="172" cy="166" r="12" fill="currentColor" stroke="none" />
  </>,
  containerBody,
);

/** Terminal Space Icon: End-node anchor target where devices attach */
const terminalPuck = <rect x="44" y="60" width="168" height="136" rx="36" />;

export const CustomTerminalIcon = createCustomIcon(
  'CustomTerminalIcon',
  <>
    {terminalPuck}
    {/* Center connector port & crosshair target */}
    <circle cx="128" cy="128" r="28" />
    <circle cx="128" cy="128" r="10" fill="currentColor" stroke="none" />
    <path d="M128 60 V76" />
    <path d="M128 180 V196" />
    <path d="M44 128 H60" />
    <path d="M196 128 H212" />
  </>,
  terminalPuck,
);
