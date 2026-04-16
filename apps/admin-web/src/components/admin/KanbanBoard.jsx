import { useMemo } from "react";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import KanbanCard from "./KanbanCard";

function toLabel(stage) {
  return String(stage || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Column({
  stage,
  applications,
  isDropAllowed,
  activeCardId,
  onCardClick,
  accentClassByStage,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { type: "column", stage } });
  const hasActive = Boolean(activeCardId);
  const disabled = hasActive && !isDropAllowed;
  const overdueCount = applications.filter((app) => app.isOverdue).length;

  return (
    <div
      className={`adm-kanban-column w-full shrink-0 ${
        disabled ? "border-gray-200 opacity-45" : "border-gray-300"
      } ${isOver ? "ring-2 ring-brand-blue/40" : ""}`}
    >
      <div className="flex items-center justify-between border-b bg-white px-3 py-2 rounded-t-xl">
        <h4 className="text-sm font-semibold">{toLabel(stage)}</h4>
        <div className="text-right">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {applications.length}
          </span>
          {overdueCount > 0 ? <p className="text-[11px] text-red-600 mt-1">⚠ {overdueCount} overdue</p> : null}
        </div>
      </div>
      <div ref={setNodeRef} className="h-[70vh] overflow-y-auto p-2 space-y-2">
        <SortableContext items={applications.map((app) => String(app.id))} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <KanbanCard
              key={app.id}
              application={app}
              onClick={onCardClick}
              accentClass={accentClassByStage[app.currentStage] || "border-l-gray-400"}
            />
          ))}
          {applications.length === 0 ? (
            <p className="text-xs text-gray-500 px-1 py-2">No applications in this stage</p>
          ) : null}
        </SortableContext>
      </div>
    </div>
  );
}

const KanbanBoard = ({
  columns,
  groupedApplications,
  canDropToStage,
  onCardClick,
  onDragStart,
  onDragEnd,
  activeCardId,
  accentClassByStage = {},
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const appIds = useMemo(
    () =>
      Object.values(groupedApplications || {})
        .flatMap((group) => (group?.applications || []).map((app) => String(app.id))),
    [groupedApplications]
  );

  return (
    <div className="overflow-x-auto pb-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <SortableContext items={appIds} strategy={verticalListSortingStrategy}>
          <div className="flex gap-3 min-w-max">
            {columns.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                applications={groupedApplications?.[stage]?.applications || []}
                isDropAllowed={canDropToStage(stage)}
                activeCardId={activeCardId}
                onCardClick={onCardClick}
                accentClassByStage={accentClassByStage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
