import type * as React from 'react';

import { cn } from '@/app/shared/utils/cn';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'narrow' | 'default' | 'wide' | 'full';
}

const sizeClasses = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

/**
 * Standard page frame: <PageHeader> first (it sticks to the top), then the page body.
 * Owns the horizontal gutter and vertical rhythm — pages add no outer padding of their own.
 */
export function PageContainer({ children, className, size = 'default', ...props }: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto flex w-full flex-col gap-5 px-4 pb-8 sm:px-6 lg:px-8', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
