import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { CustomParameterForm } from '@/app/pages/templates/shared/components/custom-parameter-form';
import { ParameterSearchResults } from '@/app/pages/templates/shared/components/parameter-search-results';
import { SelectedParameterList } from '@/app/pages/templates/shared/components/selected-parameter-list';
import { useFetchMetricDefinitions } from '@/app/pages/templates/shared/hooks/use-template-queries';
import { parameterFromDefinition, searchDefinitions } from '@/app/pages/templates/shared/lib/parameters';
import type { TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { Button } from '@/app/shared/components/ui/button';
import { Input } from '@/app/shared/components/ui/input';

type ParameterPickerProps = {
  value: TemplateParameterInput[];
  onChange: (parameters: TemplateParameterInput[]) => void;
  disabled?: boolean;
};

/**
 * Search the parameter catalogue and add parameters to a template.
 * Anything missing from the catalogue can be created as a custom parameter on the spot.
 */
export function ParameterPicker({ value, onChange, disabled }: ParameterPickerProps) {
  const { organisation } = useOrganisationContext();

  const { data: definitions = [], isPending } = useFetchMetricDefinitions(organisation.id);

  const [query, setQuery] = useState('');

  const [isCreating, setIsCreating] = useState(false);

  const selectedKeys = useMemo(() => new Set(value.map((parameter) => parameter.key)), [value]);

  const results = useMemo(
    () => searchDefinitions(definitions, query, selectedKeys),
    [definitions, query, selectedKeys],
  );

  const add = (parameter: TemplateParameterInput) => {
    onChange([...value, parameter]);
    setQuery('');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <MagnifyingGlassIcon
            size={15}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search parameters, e.g. temperature, RPM, pressure…"
            aria-label="Search parameters"
            className="pl-9"
            disabled={disabled}
          />
        </div>

        <div
          className="max-h-56 overflow-y-auto rounded-md border"
          role="listbox"
          aria-label="Available parameters"
        >
          <ParameterSearchResults
            results={results}
            query={query}
            isPending={isPending}
            disabled={disabled}
            onSelect={(definition) => add(parameterFromDefinition(definition))}
          />
        </div>

        {isCreating ? (
          <CustomParameterForm
            initialLabel={query}
            takenKeys={selectedKeys}
            onCancel={() => setIsCreating(false)}
            onCreated={(parameter) => {
              add(parameter);
              setIsCreating(false);
            }}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => setIsCreating(true)}
          >
            <PlusIcon /> Create a custom parameter
          </Button>
        )}
      </div>

      <SelectedParameterList
        parameters={value}
        disabled={disabled}
        onRemove={(key) => onChange(value.filter((item) => item.key !== key))}
      />
    </div>
  );
}
