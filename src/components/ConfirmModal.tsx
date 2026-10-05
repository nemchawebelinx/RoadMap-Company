"use client";
import React from "react";
import { Modal, btnSecondary } from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const btnDanger =
  "px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium";

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Yes, Delete",
  cancelLabel = "No",
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-xs text-white leading-relaxed">{message}</p>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSecondary} onClick={onClose}>{cancelLabel}</button>
        <button
          className={btnDanger}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
