import { WidgetCard } from '@/app/pages/dashboards/shared/components/widget-card';
import type { LayoutEditor } from '@/app/pages/dashboards/shared/hooks/use-layout-editor';
import type { AnalyticsResult, Widget } from '@/app/pages/dashboards/shared/types';

type WidgetGridProps = {
  layout: LayoutEditor;
  resultById: Map<string, AnalyticsResult>;
  isLoading: boolean;
  isError: boolean;
  onEdit: (widget: Widget) => void;
  onDelete: (widget: Widget) => void;
};

export function WidgetGrid({ layout, resultById, isLoading, isError, onEdit, onDelete }: WidgetGridProps) {
  const { widgets, editing, dragging } = layout;

  return (
    <div className="grid grid-flow-row-dense auto-rows-[9.5rem] grid-cols-12 gap-3">
      {widgets.map((widget, index) => (
        <WidgetCard
          key={widget.id}
          widget={widget}
          result={resultById.get(widget.id)}
          isLoading={isLoading}
          isError={isError}
          editing={editing}
          isFirst={index === 0}
          isLast={index === widgets.length - 1}
          isDragging={dragging === widget.id}
          onEdit={() => onEdit(widget)}
          onDelete={() => onDelete(widget)}
          onResize={(size) => layout.resize(widget.id, size)}
          onMove={(direction) => layout.move(widget.id, index + direction)}
          onDragStart={() => layout.startDrag(widget.id)}
          onDragEnter={() => layout.dragOver(widget.id, index)}
          onDragEnd={layout.endDrag}
        />
      ))}
    </div>
  );
}
