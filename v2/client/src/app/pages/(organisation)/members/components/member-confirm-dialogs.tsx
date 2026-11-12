import { roleLabels } from '@vizibble/shared/permissions';

import type { RoleChange } from '@/app/pages/(organisation)/members/hooks/use-member-actions';
import type { Member } from '@/app/pages/(organisation)/members/types';
import { OWNER } from '@/app/pages/(organisation)/shared/lib/roles';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';

type RoleChangeDialogProps = {
  roleChange: RoleChange | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

function roleChangeCopy(roleChange: RoleChange | null) {
  const name = roleChange?.member.user.name;

  if (roleChange?.role === OWNER) {
    return {
      title: 'Make this member an owner?',
      description: `${name} will get full control, including deleting the organisation. To hand over ownership, make them an owner, then ask them to change your role.`,
      confirmLabel: 'Make owner',
    };
  }
  const roleLabel = roleChange ? roleLabels[roleChange.role].toLowerCase() : '';

  return {
    title: 'Change role?',
    description: `${name} will become ${roleLabel}. Their access changes immediately.`,
    confirmLabel: 'Change role',
  };
}

export function RoleChangeDialog({ roleChange, onClose, onConfirm, isPending }: RoleChangeDialogProps) {
  const copy = roleChangeCopy(roleChange);

  return (
    <ConfirmDialog
      open={Boolean(roleChange)}
      onClose={onClose}
      onConfirm={onConfirm}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      isPending={isPending}
    />
  );
}

type RemoveMemberDialogProps = {
  member: Member | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function RemoveMemberDialog({ member, onClose, onConfirm, isPending }: RemoveMemberDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(member)}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Remove member?"
      description={`${member?.user.name} will lose access to this organisation immediately.`}
      confirmLabel="Remove member"
      destructive
      isPending={isPending}
    />
  );
}
