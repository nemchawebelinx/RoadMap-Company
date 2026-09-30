"use client";
import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className={`relative bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl ${width} w-full mx-4 max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-[22px] leading-none">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// Reusable form field components
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500";

export const btnPrimary =
  "px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium";

export const btnSecondary =
  "px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[#333] text-white text-xs rounded";
