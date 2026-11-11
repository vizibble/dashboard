import { Outlet } from 'react-router-dom';

import { TooltipProvider } from '@/components/ui/tooltip';

import { DesktopSidebar } from '@/app/shared/components/navigation/desktop-sidebar';
import { MobileNavigation } from '@/app/shared/components/navigation/mobile-navigation';
import { useTheme } from '@/app/shared/hooks/use-theme';

export function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <div className="bg-background text-foreground flex h-dvh w-full overflow-hidden">
        <DesktopSidebar theme={theme} onToggleTheme={toggleTheme} />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <MobileNavigation theme={theme} onToggleTheme={toggleTheme} />
      </div>
    </TooltipProvider>
  );
}
