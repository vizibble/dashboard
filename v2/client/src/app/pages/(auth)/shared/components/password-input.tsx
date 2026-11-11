import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import * as React from 'react';

import { IconSwap } from '@/app/shared/components/ui/icon-swap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>;

export const PasswordInput = React.forwardRef<React.ElementRef<typeof Input>, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = React.useState(false);
    const toggleId = React.useId();
    const toggleVisibility = React.useCallback(() => {
      setVisible((current) => !current);
    }, []);

    return (
      <div className="relative">
        <Input {...props} ref={ref} type={visible ? 'text' : 'password'} className={cn('pr-10', className)} />
        <Button
          id={toggleId}
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={toggleVisibility}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 size-9 -translate-y-1/2 hover:bg-transparent"
        >
          <IconSwap swapKey={visible ? 'hide' : 'show'}>{visible ? <EyeSlashIcon /> : <EyeIcon />}</IconSwap>
        </Button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
