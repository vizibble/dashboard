import { useCallback, useState } from 'react';

/**
 * Mirrors a Radix root's open state (controlled or not) so content can be wrapped in
 * <AnimatePresence> and kept mounted with forceMount until its exit animation finishes.
 */
export function useOpenState(
  open: boolean | undefined,
  defaultOpen = false,
  onOpenChange?: (open: boolean) => void,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);

  const isControlled = open !== undefined;

  const value = isControlled ? open : uncontrolled;

  const setValue = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return [value, setValue] as const;
}
