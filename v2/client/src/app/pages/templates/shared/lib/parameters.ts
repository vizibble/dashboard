import { metricDataTypeSchema } from '@vizibble/shared/templates';

import type {
  MetricDataType,
  MetricDefinition,
  TemplateParameter,
  TemplateParameterInput,
} from '@/app/pages/templates/shared/types';

export const DATA_TYPE_LABELS: Record<MetricDataType, string> = {
  number: 'Decimal',
  integer: 'Whole number',
  boolean: 'On / Off',
  string: 'Text',
};

/** Data types in the order they are offered. */
export const DATA_TYPES: MetricDataType[] = ['number', 'integer', 'boolean', 'string'];

export function isMetricDataType(value: string): value is MetricDataType {
  return metricDataTypeSchema.safeParse(value).success;
}

const PARAMETER_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;

export function isValidParameterKey(key: string) {
  return PARAMETER_KEY_PATTERN.test(key);
}

/** "Flow rate (L/min)" → "flow_rate_l_min": a valid, readable telemetry key. */
export function toParameterKey(label: string) {
  const key = label
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/^[^a-z]+/, '');

  return key.slice(0, 100);
}

type ParameterFields = Pick<TemplateParameterInput, 'key' | 'label' | 'data_type' | 'unit' | 'symbol'>;

function buildParameterInput(metricDefinitionId: string | null | undefined, source: ParameterFields) {
  const parameter: TemplateParameterInput = {
    metric_definition_id: metricDefinitionId,
    key: source.key,
    label: source.label,
    data_type: source.data_type,
    unit: source.unit,
    symbol: source.symbol,
  };

  return parameter;
}

export function parameterFromDefinition(definition: MetricDefinition): TemplateParameterInput {
  return buildParameterInput(definition.id, definition);
}

export function toParameterInput(parameter: TemplateParameter): TemplateParameterInput {
  return buildParameterInput(parameter.metric_definition_id, parameter);
}

/** Catalogue entries not yet selected that match the search term (first 8). */
export function searchDefinitions(definitions: MetricDefinition[], query: string, selectedKeys: Set<string>) {
  const term = query.trim().toLowerCase();

  return definitions
    .filter((definition) => !selectedKeys.has(definition.key))
    .filter((definition) => matchesTerm(definition, term))
    .slice(0, 8);
}

function matchesTerm(definition: MetricDefinition, term: string) {
  if (!term) {
    return true;
  }
  if (definition.label.toLowerCase().includes(term)) {
    return true;
  }
  if (definition.key.includes(term)) {
    return true;
  }

  return Boolean(definition.category?.toLowerCase().includes(term));
}

/** How many of the template's saved parameters are missing from the edited list. */
export function countRemovedParameters(saved: TemplateParameter[], edited: TemplateParameterInput[]) {
  const editedKeys = new Set(edited.map((parameter) => parameter.key));

  return saved.filter((parameter) => !editedKeys.has(parameter.key)).length;
}

/** "1 device", "3 devices". */
export function pluralise(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
