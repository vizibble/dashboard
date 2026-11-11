import { Spinner } from '@/app/shared/components/ui/spinner';
import { cn } from '@/app/shared/utils/cn';

export type LoadingStateProps = {
  label: string;
  variant: 'fullscreen' | 'inline';
  className?: string;
};

export function LoadingState({ label, variant, className }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div
        className={cn('text-muted-foreground flex items-center justify-center gap-2.5 py-8 text-sm', className)}
        role="status"
      >
        <Spinner aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  } else {
    return (
      <main className={cn('flex min-h-svh items-center justify-center px-5', className)}>
        <div className="text-muted-foreground flex items-center gap-3 text-sm" role="status">
          <Spinner aria-hidden="true" />
          <span>{label}</span>
        </div>
      </main>
    );
  }
}
