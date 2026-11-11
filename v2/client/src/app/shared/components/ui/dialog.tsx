import { XIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { useOpenState } from '@/app/shared/hooks/use-open-state';
import { cn } from '@/app/shared/utils/cn';
import { transition } from '@/app/shared/utils/motion';

const DialogOpenContext = React.createContext(false);

function Dialog({ open, defaultOpen, onOpenChange, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  return (
    <DialogOpenContext.Provider value={isOpen}>
      <DialogPrimitive.Root data-slot="dialog" open={isOpen} onOpenChange={setOpen} {...props} />
    </DialogOpenContext.Provider>
  );
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay data-slot="dialog-overlay" forceMount asChild {...props}>
      <motion.div
        className={cn('fixed inset-0 z-50 bg-black/50', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: transition.enter }}
        exit={{ opacity: 0, transition: transition.exit }}
      />
    </DialogPrimitive.Overlay>
  );
}

function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showClose?: boolean;
}) {
  const open = React.useContext(DialogOpenContext);

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount data-slot="dialog-portal">
          <DialogOverlay />
          <DialogPrimitive.Content data-slot="dialog-content" forceMount asChild {...props}>
            <motion.div
              className={cn(
                'bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border p-6 shadow-xl sm:max-w-lg',
                className,
              )}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: transition.enter.ease } }}
              exit={{ opacity: 0, scale: 0.97, transition: transition.exit }}
            >
              {children}
              {showClose && (
                <DialogPrimitive.Close className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 transition-interactive press absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] disabled:pointer-events-none">
                  <XIcon className="size-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
