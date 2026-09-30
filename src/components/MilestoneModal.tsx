"use client";
import React, { useState, useEffect } from "react";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "./Modal";
import { ColorPicker } from "./ColorPicker";
import { Milestone } from "@/lib/types";
import { formatDate } from "@/lib/date";

interface MilestoneModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Milestone, "id">) => void;
  initial?: Milestone | null;
}

export function MilestoneModal({ open, onClose, onSave, initial }: MilestoneModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [color, setColor] = useState("purple-500");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setDate(initial.date);
      setColor(initial.color);
      setDescription(initial.description);
    } else {
      setTitle("");
      setDate(formatDate(new Date()));
      setColor("purple-500");
      setDescription("");
    }
  }, [initial, open]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, color, description });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Milestone" : "Add Milestone"}>
      <Field label="Title">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </Field>
      <Field label="Date">
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Color">
        <ColorPicker value={color} onChange={setColor} />
      </Field>
      <Field label="Description">
        <textarea
          className={inputClass + " h-20 resize-none"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
