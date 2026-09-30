"use client";
import React, { useState, useEffect } from "react";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "./Modal";
import { ColorPicker } from "./ColorPicker";
import { Department } from "@/lib/types";

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Department, "id" | "order" | "isHidden">) => void;
  initial?: Department | null;
}

export function DepartmentModal({ open, onClose, onSave, initial }: DepartmentModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue-500");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setColor(initial.color);
    } else {
      setName("");
      setColor("blue-500");
    }
  }, [initial, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Department" : "Add Department"}>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Color">
        <ColorPicker value={color} onChange={setColor} />
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
