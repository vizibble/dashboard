import { DotsThreeIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { IconSwap } from '@/app/shared/components/ui/icon-swap';
import type { Theme } from '@/app/shared/hooks/use-theme';
import { transition } from '@/app/shared/utils/motion';
import { MOBILE_MORE_ITEMS, useVisibleNavItems } from './nav-items';

type MobileMoreMenuProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

function matchesRoute(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function MobileMoreMenu({ theme, onToggleTheme }: MobileMoreMenuProps) {
  const [open, setOpen] = useState(false);

  const moreItems = useVisibleNavItems(MOBILE_MORE_ITEMS);

  const menuRef = useRef<HTMLDivElement>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);

  const location = useLocation();

  const isMoreRouteActive = moreItems.some((item) => matchesRoute(location.pathname, item.path));

  // Close the menu whenever the route changes (adjusting state during render, not in an effect).
  const [lastPathname, setLastPathname] = useState(location.pathname);

  if (lastPathname !== location.pathname) {
    setLastPathname(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const isDark = theme === 'dark';

  const ThemeIcon = isDark ? SunIcon : MoonIcon;

  return (
    <div ref={menuRef} className="relative flex min-w-0 flex-1 justify-center">
      <button
        ref={triggerRef}
        type="button"
        aria-label="More navigation options"
        aria-expanded={open}
        aria-controls="mobile-more-menu"
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex w-full flex-col items-center justify-center gap-1',
          'transition-interactive press rounded-lg px-1 py-1.5 text-[10px] [-webkit-tap-highlight-color:transparent]',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          open || isMoreRouteActive
            ? 'text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground',
        ].join(' ')}
      >
        <DotsThreeIcon size={21} aria-hidden="true" />
        <span>More</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-more-menu"
            className="bg-popover text-popover-foreground absolute right-0 bottom-full mb-3 w-60 origin-bottom-right rounded-xl border p-2 shadow-lg"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: transition.enter }}
            exit={{ opacity: 0, scale: 0.97, transition: transition.exit }}
          >
            <nav aria-label="Additional navigation" className="space-y-1">
              {moreItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2',
                      'transition-interactive text-sm focus-visible:outline-none',
                      'focus-visible:ring-ring focus-visible:ring-2',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    ].join(' ')
                  }
                >
                  <item.icon size={19} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="my-2 border-t" />
            <button
              type="button"
              onClick={onToggleTheme}
              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring transition-interactive flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconSwap swapKey={theme}>
                <ThemeIcon size={19} aria-hidden="true" />
              </IconSwap>
              {isDark ? 'Light theme' : 'Dark theme'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
