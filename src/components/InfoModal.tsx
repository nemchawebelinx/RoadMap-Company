"use client";
import React from "react";
import { Modal, btnSecondary } from "./Modal";

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  info: Record<string, string | number | boolean>;
}

export function InfoModal({ open, onClose, title, info }: InfoModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Info: ${title}`}>
      <div className="space-y-2">
        {Object.entries(info).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="text-[var(--text-muted)] min-w-[100px]">{key}:</span>
            <span className="text-white">{String(value)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <button className={btnSecondary} onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
