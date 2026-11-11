import { DotsThreeIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';

import { useLocationActions } from '@/app/pages/locations/shared/hooks/use-location-actions';
import type { Location } from '@/app/pages/locations/shared/types';
import { Button } from '@/app/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/shared/components/ui/dropdown-menu';

interface LocationItemActionsProps {
  location: Location;
}

export function LocationItemActions({ location }: LocationItemActionsProps) {
  const { openCreate, openRename, openDelete, can } = useLocationActions();
  const canAddChild = can.create && location.can_have_children;
  if (!can.update && !can.delete && !canAddChild) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:bg-muted/80 hover:text-foreground size-8 shrink-0 sm:size-7"
          aria-label={`Actions for ${location.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <DotsThreeIcon size={18} weight="bold" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(event) => event.stopPropagation()}>
        {can.update && (
          <DropdownMenuItem onSelect={() => openRename(location.id)}>
            <PencilSimpleIcon size={14} className="mr-2 opacity-70" aria-hidden="true" />
            Rename
          </DropdownMenuItem>
        )}
        {canAddChild && (
          <DropdownMenuItem onSelect={() => openCreate(location.id)}>
            <PlusIcon size={14} className="mr-2 opacity-70" aria-hidden="true" />
            Add sub-location
          </DropdownMenuItem>
        )}
        {can.delete && (
          <>
            {(can.update || canAddChild) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={() => openDelete(location.id)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <TrashIcon size={14} className="mr-2 opacity-80" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
