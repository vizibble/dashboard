import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type ContainerProps = {
  isFullscreen: boolean;
  className?: string;
  children: ReactNode;
};

export const ChartContainer = ({
  isFullscreen,
  className,
  children,
}: ContainerProps) => {
  return (
    <div className="contents">
      {isFullscreen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" />
      )}

      <div
        className={cn(
          'bg-white border border-slate-200 rounded-xl shadow-sm transition-all',
          isFullscreen
            ? 'fixed inset-4 md:inset-10 z-50 flex flex-col p-4 md:p-6'
            : 'relative flex flex-col p-4 sm:p-5 md:p-6',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
