import { PlusIcon } from '@phosphor-icons/react';

import { ParameterLabel } from '@/app/pages/templates/shared/components/parameter-label';
import type { MetricDefinition } from '@/app/pages/templates/shared/types';
import { Spinner } from '@/app/shared/components/ui/spinner';

type ParameterSearchResultsProps = {
  results: MetricDefinition[];
  query: string;
  isPending: boolean;
  disabled?: boolean;
  onSelect: (definition: MetricDefinition) => void;
};

/** Contents of the catalogue listbox: loading, nothing to show, or the matching definitions. */
export function ParameterSearchResults({
  results,
  query,
  isPending,
  disabled,
  onSelect,
}: ParameterSearchResultsProps) {
  if (isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 p-4 text-sm">
        <Spinner /> Loading parameters…
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-center text-sm">
        {query ? `No parameter matches "${query}".` : 'All available parameters are added.'}
      </p>
    );
  }

  return results.map((definition) => (
    <button
      key={definition.id}
      type="button"
      role="option"
      aria-selected={false}
      disabled={disabled}
      onClick={() => onSelect(definition)}
      className="hover:bg-muted/60 focus-visible:bg-muted/60 flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 focus-visible:outline-none"
    >
      <ParameterLabel label={definition.label} symbol={definition.symbol} parameterKey={definition.key} />
      <span className="flex shrink-0 items-center gap-2">
        {definition.category && <span className="text-muted-foreground text-xs">{definition.category}</span>}
        <PlusIcon size={14} className="text-muted-foreground" aria-hidden="true" />
      </span>
    </button>
  ));
}
