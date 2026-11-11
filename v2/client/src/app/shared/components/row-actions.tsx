import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';

import { Button } from '@/app/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/shared/components/ui/tooltip';

type RowActionsProps = {
  /** Record name, used for accessible labels ("Edit Sensor A"). */
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** Edit / delete icon buttons for the last column of a list row. */
export function RowActions({ label, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit && <RowActionButton title="Edit" label={label} onClick={onEdit} icon={<PencilSimpleIcon />} />}
      {onDelete && <RowActionButton title="Delete" label={label} onClick={onDelete} icon={<TrashIcon />} />}
    </div>
  );
}

function RowActionButton({
  title,
  label,
  icon,
  onClick,
}: {
  title: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`${title} ${label}`} onClick={onClick}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}
