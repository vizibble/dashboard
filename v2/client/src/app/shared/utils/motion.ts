import type { Transition } from 'motion/react';

/**
 * JS side of the motion language; CSS tokens live in styles/globals.css (--ease-*, --motion-*).
 * Most interactions are CSS. Reach for Motion only for presence (mount/unmount),
 * shared-layout movement and spring-driven direct manipulation.
 */

export const ease = {
  enter: [0.22, 1, 0.36, 1],
  exit: [0.4, 0, 1, 1],
  move: [0.65, 0, 0.35, 1],
} as const;

export const duration = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.26,
  exit: 0.12,
} as const;

export const spring = {
  /** Indicators that travel between positions (nav, tabs). Critically damped: no overshoot. */
  indicator: { type: 'spring', stiffness: 520, damping: 42, mass: 0.9 },
  /** Small direct-manipulation elements (thumbs, toggles). A hint of life, no visible bounce. */
  snappy: { type: 'spring', stiffness: 700, damping: 38 },
} as const satisfies Record<string, Transition>;

export const transition = {
  enter: { duration: duration.normal, ease: ease.enter },
  exit: { duration: duration.exit, ease: ease.exit },
} as const satisfies Record<string, Transition>;
