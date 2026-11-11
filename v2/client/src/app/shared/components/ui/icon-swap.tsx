import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';

import { transition } from '@/app/shared/utils/motion';

/**
 * Cross-fades between two icons in place (show/hide, sun/moon). The outgoing icon
 * is popped out of layout so the slot never changes size.
 */
export function IconSwap({ swapKey, children }: { swapKey: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={swapKey}
          className="inline-flex"
          initial={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: transition.enter }}
          exit={{ opacity: 0, scale: 0.6, filter: 'blur(2px)', transition: transition.exit }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
