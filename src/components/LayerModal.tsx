"use client";
import React, { useState, useEffect } from "react";
import { Modal, Field, inputClass, btnPrimary, btnSecondary } from "./Modal";
import { ColorPicker } from "./ColorPicker";
import { Layer } from "@/lib/types";

interface LayerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Layer, "id" | "order" | "isHidden">) => void;
  initial?: Layer | null;
}

export function LayerModal({ open, onClose, onSave, initial }: LayerModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("purple-500");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setColor(initial.color);
      setDescription(initial.description);
    } else {
      setName("");
      setColor("purple-500");
      setDescription("");
    }
  }, [initial, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, description });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Layer" : "Add Layer"}>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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
