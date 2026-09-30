"use client";
import React, { useState, useEffect } from "react";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "./Modal";
import { Task, TaskAssignee, Resource, Layer } from "@/lib/types";
import { useStore } from "@/lib/store";
import { colorToHex } from "@/lib/palette";
import { parseDate, addDays, formatDate } from "@/lib/date";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
  initial?: Task | null;
  defaultLayerId?: string;
}

export function TaskModal({ open, onClose, onSave, initial, defaultLayerId }: TaskModalProps) {
  const resources = useStore((s) => s.resources);
  const layers = useStore((s) => s.layers);
  const priorityMarks = useStore((s) => s.priorityMarks);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [durationDays, setDurationDays] = useState(7);
  const [priority, setPriority] = useState("mid");
  const [layerId, setLayerId] = useState(defaultLayerId || "");
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description);
      setStartDate(initial.startDate);
      setDurationDays(initial.durationDays);
      setPriority(initial.priority);
      setLayerId(initial.layerId);
      setAssignees([...initial.assignees]);
    } else {
      setName("");
      setDescription("");
      setStartDate(formatDate(new Date()));
      setDurationDays(7);
      setPriority("mid");
      setLayerId(defaultLayerId || layers[0]?.id || "");
      setAssignees([]);
    }
  }, [initial, open, defaultLayerId, layers]);

  const addAssignee = () => {
    const available = resources.filter(
      (r) => !assignees.some((a) => a.resourceId === r.id)
    );
    if (available.length === 0) return;
    setAssignees([
      ...assignees,
      {
        resourceId: available[0].id,
        percentage: 100,
        startOffsetDays: 0,
        durationDays: durationDays,
      },
    ]);
  };

  const updateAssignee = (idx: number, patch: Partial<TaskAssignee>) => {
    setAssignees((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...patch } : a))
    );
  };

  const removeAssignee = (idx: number) => {
    setAssignees((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description,
      startDate,
      durationDays,
      priority,
      layerId,
      assignees,
      assigneeIds: assignees.map((a) => a.resourceId),
    });
    onClose();
  };

  const taskLayer = layers.find((l) => l.id === layerId);

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Task" : "Add Task"} width="max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Layer">
          <select
            className={inputClass}
            value={layerId}
            onChange={(e) => setLayerId(e.target.value)}
          >
            {layers.filter((l) => !l.isHidden).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Start Date">
          <input
            type="date"
            className={inputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="Duration (days)">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={durationDays}
            onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
          />
        </Field>
        <Field label="Priority">
          <div className="flex gap-2">
            {priorityMarks.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                  priority === p.id ? "bg-[var(--bg-tertiary)] ring-1 ring-white/30" : ""
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colorToHex(p.color) }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={inputClass + " h-16 resize-none"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {/* Assignees */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">Assignees</span>
          <button onClick={addAssignee} className={btnSecondary}>+ Add Assignee</button>
        </div>
        {assignees.length > 0 && (
          <div className="space-y-2">
            {assignees.map((a, idx) => {
              const res = resources.find((r) => r.id === a.resourceId);
              const assigneeStart = addDays(parseDate(startDate), a.startOffsetDays);
              const assigneeEnd = addDays(assigneeStart, a.durationDays);
              return (
                <div key={idx} className="flex items-center gap-2 bg-[var(--bg-tertiary)] p-2 rounded text-xs">
                  <select
                    className="bg-[var(--bg)] border border-[var(--border)] rounded px-1 py-0.5 text-xs text-white"
                    value={a.resourceId}
                    onChange={(e) => updateAssignee(idx, { resourceId: e.target.value })}
                  >
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <label className="text-[var(--text-muted)]">%</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-1 py-0.5 text-xs text-white"
                    value={a.percentage}
                    onChange={(e) => updateAssignee(idx, { percentage: Math.min(100, Math.max(1, Number(e.target.value))) })}
                  />
                  <label className="text-[var(--text-muted)]">Offset</label>
                  <input
                    type="number"
                    min={0}
                    className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-1 py-0.5 text-xs text-white"
                    value={a.startOffsetDays}
                    onChange={(e) => updateAssignee(idx, { startOffsetDays: Math.max(0, Number(e.target.value)) })}
                  />
                  <label className="text-[var(--text-muted)]">Days</label>
                  <input
                    type="number"
                    min={1}
                    className="w-12 bg-[var(--bg)] border border-[var(--border)] rounded px-1 py-0.5 text-xs text-white"
                    value={a.durationDays}
                    onChange={(e) => updateAssignee(idx, { durationDays: Math.max(1, Number(e.target.value)) })}
                  />
                  <span className="text-[var(--text-muted)]">
                    {formatDate(assigneeStart)} → {formatDate(assigneeEnd)}
                  </span>
                  <button onClick={() => removeAssignee(idx)} className="text-red-400 hover:text-red-300 ml-auto text-[14px]">✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Mini timeline preview */}
        {assignees.length > 0 && taskLayer && (
          <div className="mt-3 p-2 bg-[var(--bg)] rounded">
            <div className="text-[10px] text-[var(--text-muted)] mb-1">Timeline Preview</div>
            <div className="relative h-4 bg-[var(--bg-tertiary)] rounded overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded opacity-30"
                style={{
                  width: "100%",
                  backgroundColor: colorToHex(taskLayer.color),
                }}
              />
              {assignees.map((a, idx) => {
                const leftPct = (a.startOffsetDays / durationDays) * 100;
                const widthPct = (a.durationDays / durationDays) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 h-full opacity-70 rounded"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: colorToHex(taskLayer.color),
                      borderLeft: idx > 0 ? "1px solid rgba(0,0,0,0.3)" : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSecondary} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={handleSubmit}>
          {initial ? "Save" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
