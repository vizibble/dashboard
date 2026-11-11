import { cn } from '@/app/shared/utils/cn';
import { haptic } from '@/app/shared/utils/haptics';
import { CheckIcon } from '@phosphor-icons/react';
import * as React from 'react';

interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onChange, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false);
    const resolvedChecked = checked !== undefined ? checked : isChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setIsChecked(e.target.checked);
      }
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
      haptic('selection');
    };

    return (
      <label className="group/checkbox relative inline-flex cursor-pointer items-center select-none [-webkit-tap-highlight-color:transparent]">
        <input
          type="checkbox"
          ref={ref}
          checked={resolvedChecked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          data-slot="checkbox"
          className={cn(
            'border-input transition-interactive group-hover/checkbox:border-foreground/30 flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs group-active/checkbox:scale-(--motion-press-scale) peer-disabled:group-active/checkbox:scale-100',
            'peer-focus-visible:ring-ring/50 peer-focus-visible:border-ring peer-focus-visible:ring-[3px]',
            'peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className,
          )}
        >
          <CheckIcon
            weight="bold"
            aria-hidden="true"
            className={cn(
              'ease-enter size-3 transition-[opacity,scale] duration-(--motion-fast)',
              resolvedChecked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
          />
        </div>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
