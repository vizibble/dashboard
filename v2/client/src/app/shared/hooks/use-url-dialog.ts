import { useSearchParams } from 'react-router-dom';

/**
 * Keeps "which dialog is open, for which record" in the URL (?action=edit&id=…),
 * so dialogs survive refresh, can be linked to, and close with the browser back button.
 * Only actions in `allowedActions` are reported as open, so a shared URL can't open a dialog
 * the viewer isn't allowed to use.
 */
export function useUrlDialog<TAction extends string>(allowedActions: readonly TAction[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawAction = searchParams.get('action');

  const action = allowedActions.find((allowed) => allowed === rawAction) ?? null;

  const targetId = searchParams.get('id');

  const open = (nextAction: TAction, id?: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      next.set('action', nextAction);
      if (id) {
        next.set('id', id);
      } else {
        next.delete('id');
      }

      return next;
    });
  };

  const close = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      next.delete('action');
      next.delete('id');

      return next;
    });
  };

  return { action, targetId, open, close };
}
