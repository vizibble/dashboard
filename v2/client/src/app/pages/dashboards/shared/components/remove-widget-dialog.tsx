import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useDeleteWidget } from '@/app/pages/dashboards/shared/hooks/use-dashboard-mutations';
import type { Widget } from '@/app/pages/dashboards/shared/types';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { toast } from '@/app/shared/hooks/use-toast';

type RemoveWidgetDialogProps = {
  dashboardId: string;
  /** The widget to remove; null = closed. */
  widget: Widget | null;
  onClose: () => void;
};

export function RemoveWidgetDialog({ dashboardId, widget, onClose }: RemoveWidgetDialogProps) {
  const { organisation } = useOrganisationContext();

  const { mutateAsync: deleteWidget, isPending } = useDeleteWidget(organisation.id, dashboardId);

  const remove = () => {
    if (!widget) {
      return;
    }
    void deleteWidget(widget.id)
      .then(() => toast({ variant: 'success', title: 'Widget removed' }))
      .finally(onClose);
  };

  return (
    <ConfirmDialog
      open={widget !== null}
      onClose={onClose}
      onConfirm={remove}
      title="Remove widget?"
      description={`"${widget?.title ?? ''}" will be removed from this dashboard. Device data is not affected.`}
      confirmLabel="Remove"
      destructive
      isPending={isPending}
    />
  );
}
