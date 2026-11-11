import { zodResolver } from '@hookform/resolvers/zod';
import type { AssignableRole } from '@vizibble/shared/permissions';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { RoleSelect } from '@/app/pages/(organisation)/members/components/role-select';
import { useInviteMember } from '@/app/pages/(organisation)/members/hooks/use-members';
import { Button } from '@/app/shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/shared/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/app/shared/components/ui/field';
import { Input } from '@/app/shared/components/ui/input';
import { toast } from '@/app/shared/hooks/use-toast';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.string() as z.ZodType<AssignableRole>,
});

type InviteFormValues = z.infer<typeof inviteSchema>;

type InviteMemberDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Roles the inviter may hand out. Better Auth rejects anything else on the server too. */
  roles: readonly AssignableRole[];
};

export function InviteMemberDialog({ open, onClose, roles }: InviteMemberDialogProps) {
  const { mutateAsync, isPending } = useInviteMember();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'viewer' },
  });

  // Reset form when dialog opens/closes.
  useEffect(() => {
    if (open) {
      reset({ email: '', role: 'viewer' });
    }
  }, [open, reset]);

  const close = () => {
    if (isPending) return;
    onClose();
  };

  const onSubmit = async (values: InviteFormValues) => {
    try {
      await mutateAsync({ email: values.email.trim(), role: values.role });
      toast({
        variant: 'success',
        title: 'Invitation sent',
        description: `We emailed an invitation to ${values.email.trim()}.`,
      });
      close();
    } catch (cause: unknown) {
      setError('root', {
        message: cause instanceof Error ? cause.message : 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Invite member</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
          <div className="space-y-5 px-6 py-5">
            <Field>
              <FieldLabel htmlFor="invite-email" required>
                Email
              </FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                placeholder="name@company.com"
                aria-invalid={Boolean(errors.email)}
                disabled={isPending}
                {...register('email')}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <RoleSelect
                    id="invite-role"
                    value={field.value}
                    roles={roles}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
              <FieldDescription>You can change their role after they join.</FieldDescription>
            </Field>
            {errors.root?.message && <FieldError>{errors.root.message}</FieldError>}
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" disabled={isPending} onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} loadingText="Sending…">
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
