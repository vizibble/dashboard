import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/app/shared/components/ui/toast';
import { useToast } from '@/app/shared/hooks/use-toast';
import { haptic, type HapticKind } from '@/app/shared/utils/haptics';
import { spring, transition } from '@/app/shared/utils/motion';

const HAPTIC_BY_VARIANT: Partial<Record<string, HapticKind>> = {
  success: 'success',
  warning: 'warning',
  destructive: 'error',
};

export function Toaster() {
  const { toasts } = useToast();

  // Dismissed toasts linger in the store with open=false; presence is driven by `open`.
  const visible = toasts.filter((t) => t.open !== false);

  useOutcomeHaptics(visible);

  return (
    <ToastProvider>
      <AnimatePresence initial={false}>
        {visible.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props} forceMount asChild>
            <motion.li
              layout="position"
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { ...transition.enter, duration: 0.26 },
              }}
              exit={{ opacity: 0, scale: 0.98, transition: transition.exit }}
              transition={{ layout: spring.indicator }}
            >
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose />
            </motion.li>
          </Toast>
        ))}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  );
}

/** One haptic per newly shown outcome toast; neutral toasts stay silent. */
function useOutcomeHaptics(visible: { id: string; variant?: string | null }[]) {
  const seen = useRef(new Set<string>());

  useEffect(() => {
    for (const t of visible) {
      if (seen.current.has(t.id)) {
        continue;
      }
      seen.current.add(t.id);
      const kind = t.variant ? HAPTIC_BY_VARIANT[t.variant] : undefined;

      if (kind) {
        haptic(kind);
      }
    }
  }, [visible]);
}
