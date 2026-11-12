import { roleDescriptions, roleLabels, type AssignableRole } from '@vizibble/shared/permissions';

import { isAssignableRole } from '@/app/pages/(organisation)/shared/lib/roles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';

type RoleSelectProps = {
  id?: string;
  value: AssignableRole;
  roles: readonly AssignableRole[];
  onChange: (role: AssignableRole) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
};

export function RoleSelect({ id, value, roles, onChange, disabled, className, ...props }: RoleSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (isAssignableRole(next)) {
          onChange(next);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={props['aria-label']} className={className}>
        <SelectValue>{roleLabels[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            <span className="flex flex-col items-start">
              <span>{roleLabels[role]}</span>
              <span className="text-muted-foreground text-xs">{roleDescriptions[role]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
