import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  className?: string;
  spinnerClassName?: string;
  textClassName?: string;
}

export const Loader = ({
  text = 'Loading...',
  className = 'flex items-center justify-center gap-2.5 text-slate-400 py-12 text-sm font-medium',
  spinnerClassName = 'w-5 h-5 animate-spin text-blue-500',
  textClassName = '',
}: LoaderProps) => {
  return (
    <div className={className}>
      <Loader2 className={spinnerClassName} />
      {text && <span className={textClassName}>{text}</span>}
    </div>
  );
};
