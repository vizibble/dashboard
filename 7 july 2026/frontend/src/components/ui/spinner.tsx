import { cn } from '@/lib/utils';
import { LoaderIcon } from 'lucide-react';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <LoaderIcon
      className={cn('size-4 animate-spin', className)}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

export { Spinner };
