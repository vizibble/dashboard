/**
 * Optional haptic feedback, independent of animation.
 *
 * Uses the Vibration API where it exists (Android Chrome/Firefox). iOS Safari has no
 * navigator.vibrate, so calls are silent there. A native bridge (e.g. Capacitor Haptics)
 * can be plugged in later with setHapticAdapter without touching call sites.
 *
 * Only call for meaningful outcomes or discrete selections, never on hover or keystrokes.
 */

export type HapticKind = 'selection' | 'success' | 'warning' | 'error';
export type HapticAdapter = (kind: HapticKind) => void;

const STORAGE_KEY = 'vizibble:haptics';

const PATTERNS: Record<HapticKind, number | number[]> = {
  selection: 8,
  success: [12, 60, 12],
  warning: [20, 80, 20],
  error: [28, 60, 28, 60, 28],
};

function vibrationAdapter(kind: HapticKind) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  // Only devices with a touch-first pointer have a motor worth using.
  if (!window.matchMedia('(pointer: coarse)').matches) {
    return;
  }
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw when vibration is blocked (no user activation, iframe policy).
  }
}

let adapter: HapticAdapter = vibrationAdapter;

export function setHapticAdapter(next: HapticAdapter | null) {
  adapter = next ?? vibrationAdapter;
}

export function hapticsEnabled() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Storage unavailable (private mode); preference just won't persist.
  }
}

export function haptic(kind: HapticKind) {
  if (typeof window === 'undefined' || !hapticsEnabled()) {
    return;
  }
  adapter(kind);
}
