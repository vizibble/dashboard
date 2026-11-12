import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DotsSixVerticalIcon,
  InfoIcon,
  PencilSimpleIcon,
  TrashIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { CSSProperties, DragEvent, HTMLAttributes, ReactNode } from 'react';

import {
  HEIGHT_OPTIONS,
  MISSING_REASON_LABELS,
  WIDTH_OPTIONS,
} from '@/app/pages/dashboards/shared/lib/labels';
import type { AnalyticsResult, Widget } from '@/app/pages/dashboards/shared/types';
import { WIDGET_COMPONENTS } from '@/app/pages/dashboards/shared/widgets/registry';
import { hasValues, type WidgetPresentation } from '@/app/pages/dashboards/shared/widgets/types';
import { Button } from '@/app/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/shared/components/ui/tooltip';

type WidgetBodyProps = {
  presentation: WidgetPresentation;
  result: AnalyticsResult | undefined;
  isLoading: boolean;
  isError: boolean;
};

/** Picks the right state before handing data to a visualisation. Shared by the grid and the editor preview. */
export function WidgetBody({ presentation, result, isLoading, isError }: WidgetBodyProps) {
  if (!result) {
    if (isError) {
      return <WidgetMessage tone="error">Couldn&apos;t load data.</WidgetMessage>;
    }

    return (
      <WidgetMessage>{isLoading ? <Spinner aria-label="Loading" /> : 'Waiting for data…'}</WidgetMessage>
    );
  }
  if (result.error) {
    return <WidgetMessage tone="error">{result.error}</WidgetMessage>;
  }
  if (!result.metric) {
    return (
      <WidgetMessage>
        {result.missing.length > 0
          ? 'None of the selected devices record this parameter.'
          : 'No devices match this widget.'}
      </WidgetMessage>
    );
  }
  if (!hasValues(result)) {
    return (
      <WidgetMessage>
        {presentation.aggregation === 'latest' ? 'No readings received yet.' : 'No readings in this period.'}
      </WidgetMessage>
    );
  }
  const View = WIDGET_COMPONENTS[presentation.type];

  return <View presentation={presentation} result={result} />;
}

function WidgetMessage({ children, tone }: { children: ReactNode; tone?: 'error' }) {
  return (
    <div
      className={
        tone === 'error'
          ? 'text-destructive flex h-full items-center justify-center gap-1.5 px-2 text-center text-sm'
          : 'text-muted-foreground flex h-full items-center justify-center px-2 text-center text-sm'
      }
    >
      {tone === 'error' && <WarningCircleIcon size={16} aria-hidden="true" className="shrink-0" />}
      {children}
    </div>
  );
}

/** Small note under the title when part of the scope has no data or results were capped. */
function DataNote({ result }: { result: AnalyticsResult | undefined }) {
  if (!result || result.error || (!result.truncated && result.missing.length === 0)) {
    return null;
  }
  const lines = result.missing.map((item) => `${item.device_name} ${MISSING_REASON_LABELS[item.reason]}`);

  if (result.truncated) {
    lines.push('Only part of the data is shown. Narrow the devices or time range to see all of it.');
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          <InfoIcon size={13} aria-hidden="true" />
          {result.truncated && result.missing.length === 0
            ? 'Partial'
            : `${result.missing.length} without data`}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">
        <ul className="space-y-0.5">
          {lines.slice(0, 12).map((line) => (
            <li key={line}>{line}</li>
          ))}
          {lines.length > 12 && <li>…and {lines.length - 12} more</li>}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

type WidgetCardProps = {
  widget: Pick<Widget, 'id' | 'width' | 'height'> & WidgetPresentation;
  result: AnalyticsResult | undefined;
  isLoading: boolean;
  isError: boolean;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onResize: (size: { width?: number; height?: number }) => void;
  onMove: (direction: -1 | 1) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
};

/** Native drag-and-drop wiring for a card in edit mode. */
function dragHandlers({
  onDragStart,
  onDragEnter,
  onDragEnd,
}: Pick<WidgetCardProps, 'onDragStart' | 'onDragEnter' | 'onDragEnd'>): HTMLAttributes<HTMLElement> {
  return {
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.effectAllowed = 'move';
      onDragStart();
    },
    onDragEnter,
    onDragOver: (event: DragEvent) => event.preventDefault(),
    onDragEnd,
    onDrop: (event: DragEvent) => event.preventDefault(),
  };
}

export function WidgetCard({
  widget,
  result,
  isLoading,
  isError,
  editing,
  isFirst,
  isLast,
  isDragging,
  onEdit,
  onDelete,
  onResize,
  onMove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: WidgetCardProps) {
  const dragProps = editing ? dragHandlers({ onDragStart, onDragEnter, onDragEnd }) : {};

  const style: CSSProperties & { '--span': string } = {
    '--span': `span ${widget.width} / span ${widget.width}`,
    gridRow: `span ${widget.height}`,
  };

  return (
    <section
      aria-label={widget.title}
      className={
        'bg-card col-span-12 flex min-h-0 flex-col overflow-hidden rounded-lg border sm:col-span-6 lg:col-(--span) ' +
        (editing ? 'border-dashed ' : '') +
        (isDragging ? 'opacity-50' : '')
      }
      style={style}
      {...dragProps}
    >
      <header className="flex min-h-10 items-center justify-between gap-2 px-4 pt-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {editing && (
            <DotsSixVerticalIcon
              size={16}
              weight="bold"
              className="text-muted-foreground shrink-0 cursor-grab"
              aria-hidden="true"
            />
          )}
          <h3 className="truncate text-sm font-medium">{widget.title}</h3>
          {result?.metric && widget.type !== 'kpi' && widget.show_unit && result.metric.symbol && (
            <span className="text-muted-foreground shrink-0 text-xs">{result.metric.symbol}</span>
          )}
        </div>
        {editing ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Move earlier"
              disabled={isFirst}
              onClick={() => onMove(-1)}
            >
              <ArrowLeftIcon aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Move later"
              disabled={isLast}
              onClick={() => onMove(1)}
            >
              <ArrowRightIcon aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${widget.title}`} onClick={onEdit}>
              <PencilSimpleIcon aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${widget.title}`} onClick={onDelete}>
              <TrashIcon aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <DataNote result={result} />
        )}
      </header>
      <div className="min-h-0 flex-1 px-4 pt-1 pb-3">
        <WidgetBody presentation={widget} result={result} isLoading={isLoading} isError={isError} />
      </div>
      {editing && (
        <footer className="bg-muted/40 flex items-center gap-2 border-t px-3 py-1.5">
          <Select value={String(widget.width)} onValueChange={(value) => onResize({ width: Number(value) })}>
            <SelectTrigger size="sm" className="h-7 w-24 text-xs" aria-label="Width">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WIDTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(widget.height)}
            onValueChange={(value) => onResize({ height: Number(value) })}
          >
            <SelectTrigger size="sm" className="h-7 w-24 text-xs" aria-label="Height">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEIGHT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </footer>
      )}
    </section>
  );
}
