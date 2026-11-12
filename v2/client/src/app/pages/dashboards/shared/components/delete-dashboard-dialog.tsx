import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useDeleteDashboard } from '@/app/pages/dashboards/shared/hooks/use-dashboard-mutations';
import type { DashboardDetail } from '@/app/pages/dashboards/shared/types';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { toast } from '@/app/shared/hooks/use-toast';

type DeleteDashboardDialogProps = {
  open: boolean;
  dashboard: DashboardDetail | undefined;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteDashboardDialog({ open, dashboard, onClose, onDeleted }: DeleteDashboardDialogProps) {
  const { organisation } = useOrganisationContext();

  const { mutateAsync: deleteDashboard, isPending } = useDeleteDashboard(organisation.id);

  const remove = () => {
    if (!dashboard) {
      return;
    }
    void deleteDashboard(dashboard.id)
      .then(() => {
        toast({ variant: 'success', title: 'Dashboard deleted' });
        onDeleted();
      })
      .finally(onClose);
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={remove}
      title="Delete dashboard?"
      description={`"${dashboard?.name ?? ''}" and its widgets will be deleted for everyone. Device data is not affected.`}
      confirmLabel="Delete dashboard"
      destructive
      isPending={isPending}
    />
  );
}
