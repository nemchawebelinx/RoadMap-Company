"use client";
import React, { useRef, useCallback } from "react";
import { Task } from "@/lib/types";
import { useStore } from "@/lib/store";
import { colorToHex } from "@/lib/palette";
import { parseDate, addDays, formatDate } from "@/lib/date";

interface TaskCardProps {
  task: Task;
  layerColor: string;
  left: number;
  width: number;
  dayWidth: number;
  cardHeight: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({
  task,
  layerColor,
  left,
  width,
  dayWidth,
  cardHeight,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const updateTask = useStore((s) => s.updateTask);
  const priorityMarks = useStore((s) => s.priorityMarks);
  const resources = useStore((s) => s.resources);
  const dragRef = useRef<{
    type: "move" | "resize";
    startX: number;
    origLeft: number;
    origWidth: number;
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const priorityMark = priorityMarks.find((p) => p.id === task.priority);
  const bgColor = colorToHex(layerColor);
  const pixelLeft = left * dayWidth;
  const pixelWidth = Math.max(width * dayWidth, dayWidth);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: "move" | "resize") => {
      e.preventDefault();
      e.stopPropagation();
      const el = cardRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      dragRef.current = {
        type,
        startX: e.clientX,
        origLeft: left,
        origWidth: width,
      };

      const handleMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const daysDelta = Math.round(dx / dayWidth);

        if (dragRef.current.type === "move") {
          const newLeft = dragRef.current.origLeft + daysDelta;
          const newDate = addDays(
            parseDate(task.startDate),
            newLeft - dragRef.current.origLeft
          );
          updateTask(task.id, { startDate: formatDate(newDate) });
        } else {
          const newWidth = Math.max(1, dragRef.current.origWidth + daysDelta);
          updateTask(task.id, { durationDays: newWidth });
        }
      };

      const handleUp = () => {
        dragRef.current = null;
        el.removeEventListener("pointermove", handleMove);
        el.removeEventListener("pointerup", handleUp);
      };

      el.addEventListener("pointermove", handleMove);
      el.addEventListener("pointerup", handleUp);
    },
    [left, width, dayWidth, task, updateTask]
  );

  const showText = cardHeight >= 20;
  const showAssignees = cardHeight >= 26 && task.assignees.length > 0;

  return (
    <div
      ref={cardRef}
      className="absolute rounded-sm overflow-hidden group cursor-grab active:cursor-grabbing select-none"
      style={{
        left: pixelLeft,
        width: pixelWidth,
        height: cardHeight,
        backgroundColor: bgColor,
        opacity: 0.9,
        border: "1px solid rgba(0,0,0,0.2)",
      }}
      onPointerDown={(e) => handlePointerDown(e, "move")}
      onDoubleClick={() => onEdit(task)}
    >
      {/* Content */}
      {showText && (
        <div className="flex items-center gap-1 px-1.5 h-full overflow-hidden">
          {/* Priority dot */}
          {priorityMark && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: colorToHex(priorityMark.color) }}
            />
          )}
          <span className="text-[10px] font-medium text-white truncate leading-tight">
            {task.name}
          </span>
          {showAssignees && (
            <span className="text-[9px] text-white/60 truncate ml-auto">
              {task.assignees
                .map((a) => {
                  const r = resources.find((res) => res.id === a.resourceId);
                  return r ? `${r.name.charAt(0)}` : "";
                })
                .filter(Boolean)
                .join(",")}
              {task.assignees.length > 0 && ` (${task.assignees.map(a => `${a.percentage}%`).join(", ")})`}
            </span>
          )}
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/20"
        onPointerDown={(e) => handlePointerDown(e, "resize")}
      />

      {/* Hover edit buttons. Stop pointerdown so the card drag handler
          does not preventDefault() and swallow the click. */}
      <div
        className="absolute top-0 right-2 z-10 hidden group-hover:flex items-center gap-0.5 h-full"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="text-[11px] bg-black/40 hover:bg-black/60 text-white px-1 rounded"
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
        >
          ✎
        </button>
        <button
          type="button"
          className="text-[11px] bg-black/40 hover:bg-red-600/80 text-white px-1 rounded"
          onClick={(e) => { e.stopPropagation(); onDelete(task); }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
