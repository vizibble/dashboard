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

export function parameterFromDefinition(definition: MetricDefinition): TemplateParameterInput {
  return {
    metric_definition_id: definition.id,
    key: definition.key,
    label: definition.label,
    data_type: definition.data_type,
    unit: definition.unit,
    symbol: definition.symbol,
  };
}

export function toParameterInput(parameter: TemplateParameter): TemplateParameterInput {
  return {
    metric_definition_id: parameter.metric_definition_id,
    key: parameter.key,
    label: parameter.label,
    data_type: parameter.data_type,
    unit: parameter.unit,
    symbol: parameter.symbol,
  };
}
