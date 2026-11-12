import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';

import { spring } from '@/app/shared/utils/motion';

import type { Theme } from '@/app/shared/hooks/use-theme';

import { MobileMoreMenu } from './mobile-more-menu';
import { MOBILE_PRIMARY_ITEMS, useVisibleNavItems, type NavItem } from './nav-items';

type MobileNavigationProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

export function MobileNavigation({ theme, onToggleTheme }: MobileNavigationProps) {
  const primaryItems = useVisibleNavItems(MOBILE_PRIMARY_ITEMS);

  return (
    <nav
      aria-label="Mobile navigation"
      className={[
        'bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t',
        'px-2 pt-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur',
        'md:hidden',
      ].join(' ')}
    >
      <div className="flex items-center gap-1">
        {primaryItems.map((item) => (
          <TabBarLink key={item.id} item={item} />
        ))}
        <MobileMoreMenu theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </nav>
  );
}

function TabBarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      aria-label={item.label}
      className={({ isActive }) =>
        [
          'relative flex min-w-0 flex-1 flex-col items-center justify-center',
          'transition-interactive press gap-1 rounded-lg px-1 py-1.5 text-[10px] [-webkit-tap-highlight-color:transparent]',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={21} aria-hidden="true" />
          <span className="w-full truncate text-center">{item.label}</span>
          {isActive && (
            <motion.span
              layoutId="tabbar-active-indicator"
              transition={spring.indicator}
              aria-hidden="true"
              className="bg-primary absolute bottom-0 h-0.5 w-5 rounded-full"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
