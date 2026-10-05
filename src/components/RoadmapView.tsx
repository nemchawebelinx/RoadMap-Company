"use client";
import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Layer, Task } from "@/lib/types";
import { Horizon, stackTasks } from "@/lib/layout";
import { colorToHex } from "@/lib/palette";
import { EyeIcon, EyeOffIcon } from "./Icons";
import { TaskCard } from "./TaskCard";
import { LayerModal } from "./LayerModal";
import { TaskModal } from "./TaskModal";
import { InfoModal } from "./InfoModal";
import { ConfirmModal } from "./ConfirmModal";

interface RoadmapViewProps {
  horizon: Horizon;
  dayWidth: number;
  cardHeight: number;
  railWidth: number;
}

const GAP = 2;
const MIN_LAYER_HEIGHT = 40;

export function RoadmapView({ horizon, dayWidth, cardHeight, railWidth }: RoadmapViewProps) {
  const layers = useStore((s) => s.layers);
  const tasks = useStore((s) => s.tasks);
  const addLayer = useStore((s) => s.addLayer);
  const updateLayer = useStore((s) => s.updateLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);
  const reorderLayer = useStore((s) => s.reorderLayer);
  const toggleLayerHidden = useStore((s) => s.toggleLayerHidden);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [layerModal, setLayerModal] = useState<{ open: boolean; layer: Layer | null }>({ open: false, layer: null });
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null; layerId: string }>({ open: false, task: null, layerId: "" });
  const [infoModal, setInfoModal] = useState<{ open: boolean; title: string; info: Record<string, string | number | boolean> }>({ open: false, title: "", info: {} });
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<Task | null>(null);

  const visibleLayers = layers.filter((l) => !l.isHidden).sort((a, b) => a.order - b.order);
  const hiddenLayers = layers.filter((l) => l.isHidden).sort((a, b) => a.order - b.order);

  const computeLayerHeight = (layer: Layer) => {
    const layerTasks = tasks.filter((t) => t.layerId === layer.id);
    if (layerTasks.length === 0) return MIN_LAYER_HEIGHT;
    const stacked = stackTasks(layerTasks, horizon);
    const maxRow = Math.max(0, ...stacked.map((s) => s.row));
    return Math.max(MIN_LAYER_HEIGHT, (maxRow + 1) * (cardHeight + GAP) + GAP * 2);
  };

  return (
    <>
      {visibleLayers.map((layer) => {
        const layerTasks = tasks.filter((t) => t.layerId === layer.id);
        const stacked = stackTasks(layerTasks, horizon);
        const height = computeLayerHeight(layer);
        const taskCount = layerTasks.length;

        return (
          <div key={layer.id} className="relative flex" style={{ minHeight: height }}>
            {/* Sticky left rail */}
            <div
              className="sticky left-0 z-20 shrink-0 border-r border-b border-[var(--border)] bg-[var(--bg)] flex flex-col justify-center px-2 py-1"
              style={{ width: railWidth, minHeight: height }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: colorToHex(layer.color) }}
                />
                <span className="text-xs font-medium text-white truncate">
                  {layer.name}
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  {taskCount}
                </span>
              </div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                  onClick={() => setTaskModal({ open: true, task: null, layerId: layer.id })}
                  title="Add Task"
                >+</button>
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                  onClick={() => setLayerModal({ open: true, layer })}
                  title="Edit"
                >✎</button>
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                  onClick={() => setInfoModal({ open: true, title: layer.name, info: { Name: layer.name, Color: layer.color, Description: layer.description || "(none)", Tasks: taskCount, Hidden: layer.isHidden, Order: layer.order } })}
                  title="Info"
                >ℹ</button>
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                  onClick={() => reorderLayer(layer.id, "up")}
                  title="Move Up"
                >↑</button>
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                  onClick={() => reorderLayer(layer.id, "down")}
                  title="Move Down"
                >↓</button>
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)] inline-flex items-center"
                  onClick={() => toggleLayerHidden(layer.id)}
                  title="Hide"
                ><EyeOffIcon /></button>
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-red-600/50 rounded text-[var(--text-muted)]"
                  onClick={() => { if (confirm(`Delete layer "${layer.name}"?`)) deleteLayer(layer.id); }}
                  title="Delete"
                >✕</button>
              </div>
            </div>

            {/* Task area */}
            <div
              className="relative border-b border-[var(--border)]"
              style={{
                width: horizon.totalDays * dayWidth,
                minHeight: height,
              }}
            >
              {stacked.map((s) => (
                <div
                  key={s.task.id}
                  className="absolute"
                  style={{ top: GAP + s.row * (cardHeight + GAP) }}
                >
                  <TaskCard
                    task={s.task}
                    layerColor={layer.color}
                    left={s.left}
                    width={s.width}
                    dayWidth={dayWidth}
                    cardHeight={cardHeight}
                    railWidth={railWidth}
                    onEdit={(t) => setTaskModal({ open: true, task: t, layerId: layer.id })}
                    onDelete={(t) => setDeleteTaskConfirm(t)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {hiddenLayers.length > 0 && (
        <div className="flex" style={{ minHeight: 28 }}>
          <div
            className="sticky left-0 z-20 shrink-0 bg-[var(--bg)] border-r border-b border-[var(--border)] flex flex-wrap items-center gap-1 px-2 py-1"
            style={{ width: railWidth, minHeight: 28 }}
          >
            {hiddenLayers.map((layer) => (
              <button
                key={layer.id}
                className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-white inline-flex items-center gap-1 max-w-full"
                onClick={() => toggleLayerHidden(layer.id)}
                title={`Show "${layer.name}"`}
              >
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colorToHex(layer.color) }} />
                <EyeIcon size={10} />
                <span className="truncate">{layer.name}</span>
              </button>
            ))}
          </div>
          <div
            className="border-b border-[var(--border)]"
            style={{ width: horizon.totalDays * dayWidth, minHeight: 28 }}
          />
        </div>
      )}

      {/* Add Layer button */}
      <div className="flex" style={{ minHeight: 36 }}>
        <div
          className="sticky left-0 z-20 shrink-0 bg-[var(--bg)] flex items-center px-2"
          style={{ width: railWidth }}
        >
          <button
            className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
            onClick={() => setLayerModal({ open: true, layer: null })}
          >
            + Add Layer
          </button>
        </div>
      </div>

      {/* Modals */}
      <LayerModal
        open={layerModal.open}
        onClose={() => setLayerModal({ open: false, layer: null })}
        initial={layerModal.layer}
        onSave={(data) => {
          if (layerModal.layer) {
            updateLayer(layerModal.layer.id, data);
          } else {
            const maxOrder = Math.max(0, ...layers.map((l) => l.order));
            addLayer({
              id: `layer-${Date.now()}`,
              ...data,
              isHidden: false,
              order: maxOrder + 10,
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
          } else {
            addTask({
              id: `task-${Date.now()}`,
              layerId: data.layerId || taskModal.layerId,
              name: data.name || "Untitled",
              description: data.description || "",
              startDate: data.startDate || new Date().toISOString().slice(0, 10),
              durationDays: data.durationDays || 7,
              priority: data.priority || "mid",
              hasOutline: data.hasOutline ?? false,
              outlineColor: data.outlineColor || "white",
              assigneeIds: data.assigneeIds || [],
              assignees: data.assignees || [],
            });
          }
        }}
      />
      <InfoModal
        open={infoModal.open}
        onClose={() => setInfoModal({ open: false, title: "", info: {} })}
        title={infoModal.title}
        info={infoModal.info}
      />
      <ConfirmModal
        open={deleteTaskConfirm !== null}
        onClose={() => setDeleteTaskConfirm(null)}
        onConfirm={() => {
          if (deleteTaskConfirm) deleteTask(deleteTaskConfirm.id);
        }}
        title="Delete Task"
        message={`Delete task "${deleteTaskConfirm?.name}"? This cannot be undone.`}
      />
    </>
  );
}
