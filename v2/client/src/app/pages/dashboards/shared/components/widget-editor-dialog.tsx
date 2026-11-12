import { WidgetBody } from '@/app/pages/dashboards/shared/components/widget-card';
import { WidgetDataStep } from '@/app/pages/dashboards/shared/components/widget-data-step';
import { WidgetDisplayStep } from '@/app/pages/dashboards/shared/components/widget-display-step';
import { WidgetTypeStep } from '@/app/pages/dashboards/shared/components/widget-type-step';
import {
  useWidgetEditor,
  WIDGET_EDITOR_STEPS,
  type WidgetEditor,
} from '@/app/pages/dashboards/shared/hooks/use-widget-editor';
import { toPresentation } from '@/app/pages/dashboards/shared/lib/widget-input';
import type { DashboardDetail, DashboardFilters, Widget } from '@/app/pages/dashboards/shared/types';
import { Button } from '@/app/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog';
import { FieldError } from '@/app/shared/components/ui/field';
import { cn } from '@/app/shared/utils/cn';

type WidgetEditorDialogProps = {
  dashboard: DashboardDetail;
  filters: DashboardFilters;
  /** null = closed, 'new' = add, otherwise the widget to edit. */
  target: Widget | 'new' | null;
  onClose: () => void;
};

export function WidgetEditorDialog({ dashboard, filters, target, onClose }: WidgetEditorDialogProps) {
  const editing = target !== null && target !== 'new' ? target : null;

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        {target !== null && (
          <WidgetEditorForm
            key={editing?.id ?? 'new'}
            dashboard={dashboard}
            filters={filters}
            editing={editing}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type WidgetEditorFormProps = Omit<WidgetEditorDialogProps, 'target'> & { editing: Widget | null };

/** Remounted per widget, so its state always starts from the widget being edited. */
function WidgetEditorForm({ dashboard, filters, editing, onClose }: WidgetEditorFormProps) {
  const editor = useWidgetEditor({ dashboard, filters, editing, onClose });

  const { values, step, isLastStep, error, isSaving } = editor;

  const submitLabel = editing ? 'Save widget' : 'Add widget';

  const savingLabel = editing ? 'Saving…' : 'Adding…';

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit widget' : 'Add widget'}</DialogTitle>
        <DialogDescription>
          <WidgetEditorSteps editor={editor} />
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void editor.submit();
        }}
        className="space-y-4"
        noValidate
      >
        {step === 0 && <WidgetTypeStep value={values.type} onChange={editor.chooseType} />}
        {step === 1 && <WidgetDataStep dashboard={dashboard} editor={editor} />}
        {step === 2 && <WidgetDisplayStep editor={editor} />}
        {step > 0 && <WidgetPreview editor={editor} />}

        {error && <FieldError>{error}</FieldError>}

        <DialogFooter>
          {step > 0 && (
            <Button type="button" variant="outline" onClick={editor.back} disabled={isSaving}>
              Back
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} loadingText={isLastStep ? savingLabel : 'Next…'}>
            {isLastStep ? submitLabel : 'Next'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function WidgetEditorSteps({ editor }: { editor: WidgetEditor }) {
  const { step, goToStep } = editor;

  return (
    <ol className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
      {WIDGET_EDITOR_STEPS.map((label, index) => (
        <li key={label} className="flex items-center gap-1.5">
          {index > 0 && <span aria-hidden="true">›</span>}
          <button
            type="button"
            onClick={() => goToStep(index)}
            className={cn(
              'rounded-sm',
              index === step ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={index === step ? 'step' : undefined}
          >
            {index + 1}. {label}
          </button>
        </li>
      ))}
    </ol>
  );
}

function WidgetPreview({ editor }: { editor: WidgetEditor }) {
  const { values, previewQuery, preview } = editor;

  return (
    <section aria-label="Preview" className="bg-muted/30 rounded-lg border">
      <p className="text-muted-foreground border-b px-4 py-1.5 text-xs font-medium">Preview with live data</p>
      <div className="h-56 px-4 py-3">
        {previewQuery.length === 0 ? (
          <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Choose a parameter to see a preview.
          </p>
        ) : (
          <WidgetBody
            presentation={toPresentation(values)}
            result={preview.data?.results[0]}
            isLoading={preview.isFetching}
            isError={preview.isError}
          />
        )}
      </div>
    </section>
  );
}
