import { XIcon } from '@phosphor-icons/react';

import { ParameterLabel } from '@/app/pages/templates/shared/components/parameter-label';
import { DATA_TYPE_LABELS, pluralise } from '@/app/pages/templates/shared/lib/parameters';
import type { TemplateParameterInput } from '@/app/pages/templates/shared/types';
import { Badge } from '@/app/shared/components/ui/badge';
import { Button } from '@/app/shared/components/ui/button';

type SelectedParameterListProps = {
  parameters: TemplateParameterInput[];
  disabled?: boolean;
  onRemove: (key: string) => void;
};

export function SelectedParameterList({ parameters, disabled, onRemove }: SelectedParameterListProps) {
  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-xs font-medium">
        {parameters.length === 0 ? 'No parameters added yet' : pluralise(parameters.length, 'parameter')}
      </p>
      {parameters.length > 0 && (
        <ul className="divide-y rounded-md border">
          {parameters.map((parameter) => (
            <li key={parameter.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <ParameterLabel
                label={parameter.label}
                symbol={parameter.symbol}
                parameterKey={parameter.key}
              />
              <span className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{DATA_TYPE_LABELS[parameter.data_type]}</Badge>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${parameter.label}`}
                  disabled={disabled}
                  onClick={() => onRemove(parameter.key)}
                >
                  <XIcon />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
