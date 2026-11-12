import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { cn } from '@/app/shared/utils/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CopyIdButtonProps {
  id: string;
  truncateLength?: number;
  className?: string;
}

export function CopyIdButton({ id, truncateLength = 8, className }: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write errors
    }
  };

  const displayText = truncateLength && id.length > truncateLength ? id.slice(0, truncateLength) : id;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={cn(
            'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50 inline-flex cursor-pointer items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs transition-colors',
            className,
          )}
          aria-label={`Copy ID ${id}`}
        >
          <span>{displayText}</span>
          {copied ? (
            <CheckIcon size={12} className="text-emerald-500" aria-hidden="true" />
          ) : (
            <CopyIcon size={12} className="opacity-60" aria-hidden="true" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? 'Copied to clipboard' : 'Click to copy full ID'}</TooltipContent>
    </Tooltip>
  );
}
