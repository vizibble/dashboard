import { useMemo, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useSaveWidget } from '@/app/pages/dashboards/shared/hooks/use-dashboard-mutations';
import {
  useDashboardData,
  useDiscoverMetrics,
} from '@/app/pages/dashboards/shared/hooks/use-dashboard-queries';
import {
  buildWidgetQuery,
  dashboardScope,
  sourcesScope,
  widgetToInput,
} from '@/app/pages/dashboards/shared/lib/build-query';
import {
  aggregationOptions,
  canPreview,
  emptyWidgetInput,
  initialSourceMode,
  validateWidgetData,
  withMetric,
  withWidgetType,
  type SourceMode,
} from '@/app/pages/dashboards/shared/lib/widget-input';
import type {
  DashboardDetail,
  DashboardFilters,
  Widget,
  WidgetInput,
  WidgetType,
} from '@/app/pages/dashboards/shared/types';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

export const WIDGET_EDITOR_STEPS = ['Visualisation', 'Data', 'Display'] as const;
const DATA_STEP = 1;

const LAST_STEP = WIDGET_EDITOR_STEPS.length - 1;

type UseWidgetEditorOptions = {
  dashboard: DashboardDetail;
  filters: DashboardFilters;
  /** The widget being edited, or null when adding one. */
  editing: Widget | null;
  onClose: () => void;
};

/** State and step-by-step submit flow of the widget editor. */
export function useWidgetEditor({ dashboard, filters, editing, onClose }: UseWidgetEditorOptions) {
  const { organisation } = useOrganisationContext();

  const { mutateAsync: save, isPending: isSaving } = useSaveWidget(organisation.id, dashboard.id);

  const [values, setValues] = useState<WidgetInput>(() =>
    editing ? widgetToInput(editing) : emptyWidgetInput('line'),
  );

  const [step, setStep] = useState(editing ? DATA_STEP : 0);

  const [sourceMode, setSourceMode] = useState<SourceMode>(() => initialSourceMode(values));

  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WidgetInput>(key: K, value: WidgetInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const sources = useMemo(() => values.sources ?? [], [values.sources]);

  // Parameters are discovered on the widget's own sources, or the (filtered) dashboard scope.
  const scope = useMemo(() => {
    if (sources.length === 0) {
      return dashboardScope(dashboard, filters);
    }

    return { ...sourcesScope(sources), include_child_locations: true };
  }, [dashboard, filters, sources]);

  const { data: metrics = [], isPending: isMetricsPending } = useDiscoverMetrics(organisation.id, scope);

  const metric = metrics.find((item) => item.key === values.metric_key);

  const aggregations = aggregationOptions(values.type, metric);

  const previewQuery = useMemo(() => {
    if (!canPreview(values)) {
      return [];
    }

    return [buildWidgetQuery('preview', values, dashboard, filters)];
  }, [dashboard, filters, values]);

  const preview = useDashboardData(organisation.id, previewQuery, 0);

  const chooseType = (type: WidgetType) =>
    setValues((current) => withWidgetType(current, type, metrics, editing === null));

  const chooseMetric = (key: string) => {
    const next = metrics.find((item) => item.key === key);

    setValues((current) => withMetric(current, key, next));
  };

  const chooseSourceMode = (mode: SourceMode) => {
    setSourceMode(mode);
    set('sources', []);
  };

  const changeTitle = (title: string) => {
    set('title', title);
    if (title.trim()) {
      setError(null);
    }
  };

  // Later steps open once a parameter is chosen.
  const goToStep = (index: number) => {
    if (index > step && !values.metric_key) {
      return;
    }
    setStep(index);
  };

  const validate = () => validateWidgetData(values, { aggregations, sourceMode });

  const advance = () => {
    const problem = step === DATA_STEP ? validate() : null;

    if (problem) {
      setError(problem);

      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const finish = async () => {
    const problem = validate() ?? (values.title.trim() ? null : 'Give the widget a title.');

    if (problem) {
      setError(problem);

      return;
    }
    try {
      await save({
        widgetId: editing?.id,
        values: {
          ...values,
          title: values.title.trim(),
          sources: sourceMode === 'dashboard' ? [] : sources,
        },
      });
      toast({
        variant: 'success',
        title: editing ? 'Widget updated' : 'Widget added',
      });
      onClose();
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Unable to save widget.'));
    }
  };

  const submit = async () => {
    if (step < LAST_STEP) {
      return advance();
    }
    await finish();
  };

  return {
    values,
    set,
    sources,
    sourceMode,
    step,
    isLastStep: step === LAST_STEP,
    error,
    isSaving,
    metrics,
    metric,
    isMetricsPending,
    aggregations,
    previewQuery,
    preview,
    chooseType,
    chooseMetric,
    chooseSourceMode,
    changeTitle,
    goToStep,
    back: () => setStep(step - 1),
    submit,
  };
}

export type WidgetEditor = ReturnType<typeof useWidgetEditor>;
