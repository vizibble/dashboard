import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useSaveLayout } from '@/app/pages/dashboards/shared/hooks/use-dashboard-mutations';
import {
  applyLayoutDraft,
  moveLayoutItem,
  resizeLayoutItem,
  toLayoutInput,
  toLayoutItems,
  type LayoutItem,
} from '@/app/pages/dashboards/shared/lib/dashboard-layout';
import type { DashboardDetail } from '@/app/pages/dashboards/shared/types';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

/**
 * Edit mode for one dashboard: reorder (buttons or drag) and resize widgets as a local
 * draft, then save the whole layout at once. Switching dashboards leaves edit mode.
 */
export function useLayoutEditor(dashboard: DashboardDetail | undefined) {
  const { organisation } = useOrganisationContext();

  const { mutateAsync: saveLayout, isPending: isSaving } = useSaveLayout(
    organisation.id,
    dashboard?.id ?? '',
  );

  const [editingId, setEditingId] = useState<string | null>(null);

  const [draft, setDraft] = useState<LayoutItem[] | null>(null);

  const [dragging, setDragging] = useState<string | null>(null);

  const editing = Boolean(dashboard) && editingId === dashboard?.id;

  const widgets = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    if (!editing || !draft) {
      return dashboard.widgets;
    }

    return applyLayoutDraft(dashboard.widgets, draft);
  }, [dashboard, draft, editing]);

  const updateDraft = (update: (items: LayoutItem[]) => LayoutItem[]) =>
    setDraft(update(toLayoutItems(widgets)));

  const start = () => {
    setDraft(null);
    setEditingId(dashboard?.id ?? null);
  };

  const cancel = () => {
    setDraft(null);
    setEditingId(null);
  };

  const save = async () => {
    if (!draft) {
      return cancel();
    }
    try {
      await saveLayout(toLayoutInput(toLayoutItems(widgets)));
      toast({ variant: 'success', title: 'Layout saved' });
      cancel();
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to save layout',
        description: getErrorMessage(cause),
      });
    }
  };

  const move = (id: string, toIndex: number) => updateDraft((items) => moveLayoutItem(items, id, toIndex));

  const resize = (id: string, size: { width?: number; height?: number }) =>
    updateDraft((items) => resizeLayoutItem(items, id, size));

  /** While dragging, entering another widget moves the dragged one into its place. */
  const dragOver = (id: string, index: number) => {
    if (!dragging || dragging === id) {
      return;
    }
    move(dragging, index);
  };

  return {
    editing,
    widgets,
    isSaving,
    dragging,
    start,
    cancel,
    save,
    move,
    resize,
    startDrag: setDragging,
    dragOver,
    endDrag: () => setDragging(null),
  };
}

export type LayoutEditor = ReturnType<typeof useLayoutEditor>;
