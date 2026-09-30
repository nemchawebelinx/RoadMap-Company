"use client";
import React, { useState, useEffect } from "react";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "./Modal";
import { Resource } from "@/lib/types";
import { useStore } from "@/lib/store";

interface ResourceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Resource, "id" | "isHidden">) => void;
  initial?: Resource | null;
  defaultDepartmentId?: string;
}

export function ResourceModal({ open, onClose, onSave, initial, defaultDepartmentId }: ResourceModalProps) {
  const departments = useStore((s) => s.departments);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [availableHours, setAvailableHours] = useState(40);
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId || "");
  const [notes, setNotes] = useState("");
  const [picture, setPicture] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setPosition(initial.position);
      setAvailableHours(initial.availableHours);
      setDepartmentId(initial.departmentId);
      setNotes(initial.notes);
      setPicture(initial.picture);
    } else {
      setName("");
      setPosition("");
      setAvailableHours(40);
      setDepartmentId(defaultDepartmentId || departments[0]?.id || "");
      setNotes("");
      setPicture("");
    }
  }, [initial, open, defaultDepartmentId, departments]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), position, availableHours, departmentId, notes, picture });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Resource" : "Add Resource"}>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Position">
        <input className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)} />
      </Field>
      <Field label="Department">
        <select className={inputClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Available Hours/Week">
        <input
          type="number"
          min={0}
          className={inputClass}
          value={availableHours}
          onChange={(e) => setAvailableHours(Number(e.target.value))}
        />
      </Field>
      <Field label="Notes">
        <textarea
          className={inputClass + " h-16 resize-none"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSecondary} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={handleSubmit}>
          {initial ? "Save" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
