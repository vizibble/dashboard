import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { NavLink, useMatch } from 'react-router-dom';

import { BrandLogo } from '@/app/shared/components/brand-logo';
import { IconSwap } from '@/app/shared/components/ui/icon-swap';
import type { Theme } from '@/app/shared/hooks/use-theme';
import { spring } from '@/app/shared/utils/motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { MAIN_NAV_ITEMS, UTILITY_NAV_ITEMS, useVisibleNavItems, type NavItem } from './nav-items';

type DesktopSidebarProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

export function DesktopSidebar({ theme, onToggleTheme }: DesktopSidebarProps) {
  const mainItems = useVisibleNavItems(MAIN_NAV_ITEMS);
  const utilityItems = useVisibleNavItems(UTILITY_NAV_ITEMS);
  return (
    <aside className="bg-sidebar z-40 hidden h-full w-16 shrink-0 flex-col items-center justify-between border-r py-4 md:flex">
      <div className="flex flex-col items-center gap-6">
        <BrandLogo
          to="/dashboard"
          aria-label="Vizibble dashboard"
          hideText
          className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        />
        <nav aria-label="Main navigation" className="flex flex-col gap-2">
          {mainItems.map((item) => (
            <SidebarLink key={item.id} item={item} />
          ))}
        </nav>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <div aria-hidden="true" className="bg-border my-1 h-px w-8" />
        <nav aria-label="Utility navigation" className="flex flex-col gap-2">
          {utilityItems.map((item) => (
            <SidebarLink key={item.id} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const end = item.path === '/dashboard';
  const isActive = useMatch({ path: item.path, end }) !== null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.path}
          end={end}
          aria-label={item.label}
          className={[
            'relative flex size-11 items-center justify-center rounded-xl',
            'transition-interactive press focus-visible:outline-none',
            'focus-visible:ring-ring focus-visible:ring-2',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          ].join(' ')}
        >
          {isActive && (
            <motion.span
              layoutId="sidebar-active-indicator"
              transition={spring.indicator}
              aria-hidden="true"
              className="bg-primary absolute top-3 -left-1 h-5 w-0.5 rounded-r-full"
            />
          )}
          <item.icon size={21} aria-hidden="true" />
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  const Icon = isDark ? SunIcon : MoonIcon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={label}
          className="text-muted-foreground size-11 rounded-xl"
        >
          <IconSwap swapKey={theme}>
            <Icon size={20} aria-hidden="true" />
          </IconSwap>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
