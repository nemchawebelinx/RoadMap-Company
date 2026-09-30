"use client";
import React, { useState, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Department, Resource, Task, TaskAssignee } from "@/lib/types";
import { Horizon, dayIndex } from "@/lib/layout";
import { colorToHex, colorToRgba } from "@/lib/palette";
import { parseDate, addDays, formatDate } from "@/lib/date";
import { DepartmentModal } from "./DepartmentModal";
import { EyeIcon, EyeOffIcon } from "./Icons";
import { ResourceModal } from "./ResourceModal";
import { TaskModal } from "./TaskModal";
import { InfoModal } from "./InfoModal";

interface ResourcesViewProps {
  horizon: Horizon;
  dayWidth: number;
  cardHeight: number;
  railWidth: number;
}

const GAP = 2;
const MIN_ROW_HEIGHT = 40;

interface ResourceBar {
  task: Task;
  assignee: TaskAssignee;
  left: number;
  width: number;
  layerColor: string;
}

export function ResourcesView({ horizon, dayWidth, cardHeight, railWidth }: ResourcesViewProps) {
  const departments = useStore((s) => s.departments);
  const resources = useStore((s) => s.resources);
  const tasks = useStore((s) => s.tasks);
  const layers = useStore((s) => s.layers);
  const addDepartment = useStore((s) => s.addDepartment);
  const updateDepartment = useStore((s) => s.updateDepartment);
  const deleteDepartment = useStore((s) => s.deleteDepartment);
  const reorderDepartment = useStore((s) => s.reorderDepartment);
  const toggleDepartmentHidden = useStore((s) => s.toggleDepartmentHidden);
  const addResource = useStore((s) => s.addResource);
  const updateResource = useStore((s) => s.updateResource);
  const deleteResource = useStore((s) => s.deleteResource);
  const toggleResourceHidden = useStore((s) => s.toggleResourceHidden);
  const updateTask = useStore((s) => s.updateTask);

  const [deptModal, setDeptModal] = useState<{ open: boolean; dept: Department | null }>({ open: false, dept: null });
  const [resModal, setResModal] = useState<{ open: boolean; resource: Resource | null; deptId: string }>({ open: false, resource: null, deptId: "" });
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null; layerId: string }>({ open: false, task: null, layerId: "" });
  const [infoModal, setInfoModal] = useState<{ open: boolean; title: string; info: Record<string, string | number | boolean> }>({ open: false, title: "", info: {} });

  const visibleDepts = departments.filter((d) => !d.isHidden).sort((a, b) => a.order - b.order);
  const hiddenDepts = departments.filter((d) => d.isHidden).sort((a, b) => a.order - b.order);

  const getResourceBars = (resource: Resource): ResourceBar[] => {
    const bars: ResourceBar[] = [];
    for (const task of tasks) {
      const assignee = task.assignees.find((a) => a.resourceId === resource.id);
      if (!assignee) continue;
      const layer = layers.find((l) => l.id === task.layerId);
      const taskStart = parseDate(task.startDate);
      const assigneeStart = addDays(taskStart, assignee.startOffsetDays);
      const assigneeStartStr = formatDate(assigneeStart);
      const left = dayIndex(horizon, assigneeStartStr);
      bars.push({
        task,
        assignee,
        left,
        width: assignee.durationDays,
        layerColor: layer?.color || "stone-500",
      });
    }
    return bars.sort((a, b) => a.left - b.left);
  };

  // Stack bars for a resource
  const stackBars = (bars: ResourceBar[]): { bar: ResourceBar; row: number }[] => {
    const rows: number[][] = [];
    return bars.map((bar) => {
      const right = bar.left + bar.width;
      let row = 0;
      while (row < rows.length) {
        if (rows[row].every((end) => end <= bar.left)) break;
        row++;
      }
      if (row >= rows.length) rows.push([]);
      rows[row].push(right);
      return { bar, row };
    });
  };

  return (
    <>
      {visibleDepts.map((dept) => {
        const allDeptResources = resources.filter((r) => r.departmentId === dept.id);
        const deptResources = allDeptResources.filter((r) => !r.isHidden);
        const hiddenResources = allDeptResources.filter((r) => r.isHidden);

        return (
          <div key={dept.id}>
            {/* Department header */}
            <div className="flex" style={{ minHeight: 32 }}>
              <div
                className="sticky left-0 z-20 shrink-0 bg-[var(--bg)] border-r border-b border-[var(--border)] flex flex-col justify-center px-2 py-1"
                style={{ width: railWidth }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colorToHex(dept.color) }}
                  />
                  <span className="text-xs font-bold text-white uppercase tracking-wide truncate">
                    {dept.name}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)]">{deptResources.length}</span>
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  <button
                    className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                    onClick={() => setResModal({ open: true, resource: null, deptId: dept.id })}
                    title="Add Resource"
                  >+</button>
                  <button
                    className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                    onClick={() => setDeptModal({ open: true, dept })}
                    title="Edit"
                  >✎</button>
                  <button
                    className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                    onClick={() => reorderDepartment(dept.id, "up")}
                    title="Move Up"
                  >↑</button>
                  <button
                    className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                    onClick={() => reorderDepartment(dept.id, "down")}
                    title="Move Down"
                  >↓</button>
                  <button
                    className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)] inline-flex items-center"
                    onClick={() => toggleDepartmentHidden(dept.id)}
                    title="Hide"
                  ><EyeOffIcon /></button>
                  <button
                    className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-red-600/50 rounded text-[var(--text-muted)]"
                    onClick={() => { if (confirm(`Delete "${dept.name}"?`)) deleteDepartment(dept.id); }}
                    title="Delete"
                  >✕</button>
                </div>
              </div>
              <div
                className="border-b border-[var(--border)]"
                style={{ width: horizon.totalDays * dayWidth, minHeight: 32 }}
              />
            </div>

            {/* Resources in department */}
            {deptResources.map((resource) => {
              const bars = getResourceBars(resource);
              const stacked = stackBars(bars);
              const maxRow = stacked.length > 0 ? Math.max(0, ...stacked.map((s) => s.row)) : 0;
              const rowHeight = Math.max(MIN_ROW_HEIGHT, (maxRow + 1) * (cardHeight + GAP) + GAP * 2);

              return (
                <div key={resource.id} className="flex" style={{ minHeight: rowHeight }}>
                  {/* Resource rail */}
                  <div
                    className="sticky left-0 z-20 shrink-0 bg-[var(--bg)] border-r border-b border-[var(--border)] flex flex-col justify-center px-2 py-1"
                    style={{ width: railWidth, minHeight: rowHeight }}
                  >
                    <span className="text-xs font-medium text-white truncate">{resource.name}</span>
                    <span className="text-[9px] text-[var(--text-muted)] truncate">
                      {resource.position}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      <button
                        className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                        onClick={() => setResModal({ open: true, resource, deptId: dept.id })}
                        title="Edit"
                      >✎</button>
                      <button
                        className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                        onClick={() => setInfoModal({
                          open: true,
                          title: resource.name,
                          info: {
                            Name: resource.name,
                            Position: resource.position || "(none)",
                            Department: dept.name,
                            "Available Hours": resource.availableHours,
                            Notes: resource.notes || "(none)",
                            Tasks: bars.length,
                          },
                        })}
                        title="Info"
                      >ℹ</button>
                      <button
                        className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)] inline-flex items-center"
                        onClick={() => toggleResourceHidden(resource.id)}
                        title="Hide"
                      ><EyeOffIcon /></button>
                      <button
                        className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-red-600/50 rounded text-[var(--text-muted)]"
                        onClick={() => { if (confirm(`Delete "${resource.name}"?`)) deleteResource(resource.id); }}
                        title="Delete"
                      >✕</button>
                    </div>
                  </div>

                  {/* Bars */}
                  <div
                    className="relative border-b border-[var(--border)]"
                    style={{
                      width: horizon.totalDays * dayWidth,
                      minHeight: rowHeight,
                    }}
                  >
                    {stacked.map(({ bar, row }, idx) => {
                      const pxLeft = bar.left * dayWidth;
                      const pxWidth = Math.max(bar.width * dayWidth, dayWidth);
                      const pct = bar.assignee.percentage;
                      const topHeight = pct / 100;
                      const bgColor = colorToHex(bar.layerColor);

                      return (
                        <div
                          key={idx}
                          className="absolute rounded-sm overflow-hidden group cursor-pointer"
                          style={{
                            left: pxLeft,
                            top: GAP + row * (cardHeight + GAP),
                            width: pxWidth,
                            height: cardHeight,
                            border: "1px solid rgba(0,0,0,0.2)",
                          }}
                          onDoubleClick={() => setTaskModal({ open: true, task: bar.task, layerId: bar.task.layerId })}
                        >
                          {/* Full allocation portion */}
                          <div
                            className="absolute top-0 left-0 w-full"
                            style={{
                              height: `${topHeight * 100}%`,
                              backgroundColor: bgColor,
                              opacity: 0.9,
                            }}
                          />
                          {/* Cross-hatch remainder */}
                          {pct < 100 && (
                            <div
                              className="absolute left-0 w-full cross-hatch"
                              style={{
                                top: `${topHeight * 100}%`,
                                height: `${(1 - topHeight) * 100}%`,
                                backgroundColor: colorToRgba(bar.layerColor, 0.25),
                              }}
                            />
                          )}
                          {/* Label */}
                          {cardHeight >= 20 && (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center px-1.5 z-10">
                              <span className="text-[10px] font-medium text-white truncate">
                                {bar.task.name}
                              </span>
                              <span className="text-[9px] text-white/70 ml-1 whitespace-nowrap">
                                {pct}%
                              </span>
                              {cardHeight >= 26 && (
                                <span className="text-[8px] text-white/50 ml-1 whitespace-nowrap truncate">
                                  Day {bar.assignee.startOffsetDays}-{bar.assignee.startOffsetDays + bar.assignee.durationDays} of {bar.task.durationDays}d
                                </span>
                              )}
                            </div>
                          )}
                          {/* Resize handle for resource drag */}
                          <ResourceBarResizeHandle
                            task={bar.task}
                            assignee={bar.assignee}
                            dayWidth={dayWidth}
                            origLeft={bar.left}
                            origWidth={bar.width}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Hidden resources in department – click to show again */}
            {hiddenResources.length > 0 && (
              <div className="flex" style={{ minHeight: 28 }}>
                <div
                  className="sticky left-0 z-20 shrink-0 bg-[var(--bg)] border-r border-b border-[var(--border)] flex flex-wrap items-center gap-1 px-2 py-1"
                  style={{ width: railWidth, minHeight: 28 }}
                >
                  {hiddenResources.map((r) => (
                    <button
                      key={r.id}
                      className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-white inline-flex items-center gap-1 max-w-full"
                      onClick={() => toggleResourceHidden(r.id)}
                      title={`Show "${r.name}"`}
                    >
                      <EyeIcon size={10} />
                      <span className="truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
                <div
                  className="border-b border-[var(--border)]"
                  style={{ width: horizon.totalDays * dayWidth, minHeight: 28 }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Hidden departments – click to show again */}
      {hiddenDepts.length > 0 && (
        <div className="flex" style={{ minHeight: 28 }}>
          <div
            className="sticky left-0 z-20 shrink-0 bg-[var(--bg)] border-r border-b border-[var(--border)] flex flex-wrap items-center gap-1 px-2 py-1"
            style={{ width: railWidth, minHeight: 28 }}
          >
            {hiddenDepts.map((d) => (
              <button
                key={d.id}
                className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-white inline-flex items-center gap-1 max-w-full"
                onClick={() => toggleDepartmentHidden(d.id)}
                title={`Show "${d.name}"`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorToHex(d.color) }} />
                <EyeIcon size={10} />
                <span className="truncate">{d.name}</span>
              </button>
            ))}
          </div>
          <div
            className="border-b border-[var(--border)]"
            style={{ width: horizon.totalDays * dayWidth, minHeight: 28 }}
          />
        </div>
      )}

      {/* Add Department */}
      <div className="flex" style={{ minHeight: 36 }}>
        <div
          className="sticky left-0 z-20 shrink-0 bg-[var(--bg)] flex items-center px-2"
          style={{ width: railWidth }}
        >
          <button
            className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
            onClick={() => setDeptModal({ open: true, dept: null })}
          >
            + Add Department
          </button>
        </div>
      </div>

      {/* Modals */}
      <DepartmentModal
        open={deptModal.open}
        onClose={() => setDeptModal({ open: false, dept: null })}
        initial={deptModal.dept}
        onSave={(data) => {
          if (deptModal.dept) {
            updateDepartment(deptModal.dept.id, data);
          } else {
            const maxOrder = Math.max(0, ...departments.map((d) => d.order));
            addDepartment({
              id: `dep-${Date.now()}`,
              ...data,
              isHidden: false,
              order: maxOrder + 10,
            });
          }
        }}
      />
      <ResourceModal
        open={resModal.open}
        onClose={() => setResModal({ open: false, resource: null, deptId: "" })}
        initial={resModal.resource}
        defaultDepartmentId={resModal.deptId}
        onSave={(data) => {
          if (resModal.resource) {
            updateResource(resModal.resource.id, data);
          } else {
            addResource({
              id: `res-${Date.now()}`,
              ...data,
              isHidden: false,
            });
          }
        }}
      />
      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, layerId: "" })}
        initial={taskModal.task}
        defaultLayerId={taskModal.layerId}
        onSave={(data) => {
          if (taskModal.task) {
            updateTask(taskModal.task.id, data);
          }
        }}
      />
      <InfoModal
        open={infoModal.open}
        onClose={() => setInfoModal({ open: false, title: "", info: {} })}
        title={infoModal.title}
        info={infoModal.info}
      />
    </>
  );
}

// Inline resize handle component for resource bars
function ResourceBarResizeHandle({
  task,
  assignee,
  dayWidth,
  origLeft,
  origWidth,
}: {
  task: Task;
  assignee: TaskAssignee;
  dayWidth: number;
  origLeft: number;
  origWidth: number;
}) {
  const updateTask = useStore((s) => s.updateTask);
  const ref = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = ref.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX };

      const onMove = (ev: PointerEvent) => {
        if (!dragState.current) return;
        const dx = ev.clientX - dragState.current.startX;
        const daysDelta = Math.round(dx / dayWidth);
        const newDuration = Math.max(1, origWidth + daysDelta);
        const newAssignees = task.assignees.map((a) =>
          a.resourceId === assignee.resourceId ? { ...a, durationDays: newDuration } : a
        );
        updateTask(task.id, { assignees: newAssignees, assigneeIds: newAssignees.map((a) => a.resourceId) });
      };

      const onUp = () => {
        dragState.current = null;
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
    },
    [dayWidth, origWidth, task, assignee, updateTask]
  );

  return (
    <div
      ref={ref}
      className="absolute top-0 right-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/20 z-20"
      onPointerDown={handlePointerDown}
    />
  );
}
