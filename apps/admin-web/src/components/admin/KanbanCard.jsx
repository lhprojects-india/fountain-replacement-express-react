import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

function formatStageAge(ms) {
  if (ms == null) return "-";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "<1h";
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  if (days < 1) return `${hours}h`;
  return `${days}d ${remH}h`;
}

function formatAppliedDate(value) {
  if (!value) return "-";
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return "-";
  const diffMs = Date.now() - createdAt.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `Applied ${Math.max(1, hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `Applied ${days}d ago`;
}

const KanbanCard = ({ application, onClick, accentClass = "border-l-blue-400" }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(application.id),
    data: { type: "application", application },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`adm-kanban-card p-3 ${accentClass} border-l-4 ${
        isDragging ? "opacity-60" : "opacity-100"
      }`}
    >
      {application.isOverdue ? (
        <div className="mb-2 text-[11px] font-semibold text-red-600">Overdue</div>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onClick?.(application)}
          className="min-w-0 text-left flex-1"
        >
          <p className="truncate text-sm font-semibold text-gray-900">{application.name}</p>
          <p className="truncate text-xs text-gray-600">{application.email}</p>
          <p className="mt-1 truncate text-xs text-gray-500">
            {application.city || "-"} • {application.vehicleType || "N/A"}
          </p>
        </button>
        <button
          type="button"
          className="cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={`Drag ${application.name || "application"}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <p>{formatAppliedDate(application.createdAt)}</p>
        <p>In stage: {formatStageAge(application.timeInCurrentStageMs)}</p>
      </div>
    </div>
  );
};

export default KanbanCard;
