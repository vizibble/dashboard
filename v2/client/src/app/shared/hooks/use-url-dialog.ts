import { useSearchParams } from 'react-router-dom';

/**
 * Keeps "which dialog is open, for which record" in the URL (?action=edit&id=…),
 * so dialogs survive refresh, can be linked to, and close with the browser back button.
 */
export function useUrlDialog<TAction extends string>() {
  const [searchParams, setSearchParams] = useSearchParams();

  const action = searchParams.get('action') as TAction | null;
  const targetId = searchParams.get('id');

  const open = (nextAction: TAction, id?: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('action', nextAction);
      if (id) next.set('id', id);
      else next.delete('id');
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
