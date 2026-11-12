import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import * as React from 'react';

import { IconSwap } from '@/app/shared/components/ui/icon-swap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>;

export const PasswordInput = React.forwardRef<React.ElementRef<typeof Input>, PasswordInputProps>(
  function PasswordInput({ className, disabled, ...props }, ref) {
    const [visible, setVisible] = React.useState(false);

    const toggleVisibility = React.useCallback(() => {
      setVisible((current) => !current);
    }, []);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          disabled={disabled}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11', className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleVisibility}
          className={cn(
            'absolute top-1/2 right-1 size-8 -translate-y-1/2',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted/70',
            'focus-visible:ring-ring focus-visible:ring-2',
            'focus-visible:ring-offset-1',
          )}
        >
          <IconSwap swapKey={visible ? 'hide' : 'show'}>
            {visible ? (
              <EyeSlashIcon size={18} weight="regular" aria-hidden="true" />
            ) : (
              <EyeIcon size={18} weight="regular" aria-hidden="true" />
            )}
          </IconSwap>
        </Button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
