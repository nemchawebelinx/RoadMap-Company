"use client";
import React, { useRef, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { ViewMode, ZOOM_PRESETS, MIN_CARD_HEIGHT, MAX_CARD_HEIGHT } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { loadFromFirestore, saveToFirestore } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";
import { signOutUser, subscribeToAuth, type User } from "@/lib/auth";
import { Modal, btnSecondary } from "./Modal";

interface HeaderProps {
  onCenterToday: () => void;
}

export function Header({ onCenterToday }: HeaderProps) {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const dayWidth = useStore((s) => s.dayWidth);
  const setDayWidth = useStore((s) => s.setDayWidth);
  const cardHeight = useStore((s) => s.cardHeight);
  const setCardHeight = useStore((s) => s.setCardHeight);
  const zoomPercent = useStore((s) => s.zoomPercent);
  const setZoomPercent = useStore((s) => s.setZoomPercent);
  const savedAt = useStore((s) => s.savedAt);
  const hydrated = useStore((s) => s.hydrated);
  const importState = useStore((s) => s.importState);
  const restoreState = useStore((s) => s.restoreState);
  const getExportData = useStore((s) => s.getExportData);
  const fileRef = useRef<HTMLInputElement>(null);

  const [sync, setSync] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "restoring" }
    | { status: "local" }
    | { status: "synced"; at: string }
    | { status: "restored"; at: string }
    | { status: "error"; error: string; unchanged?: boolean }
  >({ status: "idle" });

  const effectiveDayWidth = dayWidth * (zoomPercent / 100);

  const [user, setUser] = useState<User | null>(null);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  useEffect(() => subscribeToAuth(setUser), []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importState(data);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const data = getExportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project_state_${formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    // Saving before the Firestore load lands would push the empty initial state
    // over the real document.
    if (!hydrated) return;
    const data = getExportData();
    const at = new Date().toLocaleTimeString("en-GB", { hour12: false });
    localStorage.setItem("webelinx-roadmap-state", JSON.stringify(data));
    useStore.setState({ savedAt: at });

    if (!isFirebaseConfigured()) {
      setSync({ status: "local" });
      return;
    }
    setSync({ status: "saving" });
    const result = await saveToFirestore(data);
    if (!result.ok && result.denied) setPermissionWarning(result.error);
    setSync(
      result.ok
        ? { status: "synced", at: new Date().toLocaleTimeString("en-GB", { hour12: false }) }
        : { status: "error", error: result.error }
    );
  };

  const handleReset = async () => {
    if (!hydrated || sync.status === "saving" || sync.status === "restoring") return;
    if (!isFirebaseConfigured()) {
      setSync({
        status: "error",
        error: "Firebase is not configured, so there is no saved roadmap to restore.",
        unchanged: true,
      });
      return;
    }
    setSync({ status: "restoring" });
    const result = await loadFromFirestore();
    if (!result.ok) {
      if (result.denied) setPermissionWarning(result.error);
      setSync({ status: "error", error: result.error, unchanged: true });
      return;
    }
    if (!result.state) {
      setSync({
        status: "error",
        error: "No saved roadmap found in Firestore.",
        unchanged: true,
      });
      return;
    }
    restoreState(result.state);
    setSync({
      status: "restored",
      at: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    });
  };

  const handleZoomIn = () => {
    const next = Math.min(zoomPercent + 25, 300);
    setZoomPercent(next);
  };
  const handleZoomOut = () => {
    const next = Math.max(zoomPercent - 25, 25);
    setZoomPercent(next);
  };

  const currentPreset = ZOOM_PRESETS.find((p) => p.dayWidth === dayWidth);

  return (
    <>
    <header className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-sm shrink-0 flex-wrap min-h-[40px]">
      {/* App name */}
      <span className="font-bold text-white mr-2">WebelinxGames</span>

      {/* View tabs */}
      <button
        onClick={() => setViewMode("roadmap")}
        className={`px-3 py-1 rounded text-xs font-medium ${
          viewMode === "roadmap"
            ? "bg-[var(--bg-tertiary)] text-white"
            : "text-[var(--text-muted)] hover:text-white"
        }`}
      >
        Roadmap
      </button>
      <button
        onClick={() => setViewMode("resources")}
        className={`px-3 py-1 rounded text-xs font-medium ${
          viewMode === "resources"
            ? "bg-[var(--bg-tertiary)] text-white"
            : "text-[var(--text-muted)] hover:text-white"
        }`}
      >
        Resources
      </button>
      <a
        href="https://docs.google.com/document/d/1lyX7uDyNXV8wuNFeMMkfFGvF5wOERd5h2qxcGXa9_fc/edit?tab=t.0"
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1 rounded text-xs font-medium text-[var(--text-muted)] hover:text-white"
      >
        ChangeLog
      </a>

      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      {/* Today button */}
      <button
        onClick={onCenterToday}
        className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]"
      >
        <span className="text-[14px]">📍</span> Today
      </button>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 ml-1">
        <span className="text-[var(--text-muted)] text-[14px]">🔍</span>
        <span className="text-xs text-white">{zoomPercent}%</span>
        <select
          value={dayWidth}
          onChange={(e) => setDayWidth(Number(e.target.value))}
          className="bg-[var(--bg-tertiary)] text-xs text-white border border-[var(--border)] rounded px-1 py-0.5"
        >
          {ZOOM_PRESETS.map((p) => (
            <option key={p.label} value={p.dayWidth}>
              {p.label}
            </option>
          ))}
        </select>
        <button onClick={handleZoomOut} className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[14px] leading-none hover:bg-[#333]">−</button>
        <button onClick={handleZoomIn} className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[14px] leading-none hover:bg-[#333]">+</button>
      </div>

      {/* Card height */}
      <div className="flex items-center gap-1 ml-1">
        <span className="text-[var(--text-muted)] text-xs">{cardHeight}px</span>
        <button
          onClick={() => setCardHeight(Math.max(MIN_CARD_HEIGHT, cardHeight - 4))}
          className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[14px] leading-none hover:bg-[#333]"
        >−</button>
        <button
          onClick={() => setCardHeight(Math.min(MAX_CARD_HEIGHT, cardHeight + 4))}
          className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[14px] leading-none hover:bg-[#333]"
        >+</button>
      </div>

      <div className="flex-1" />

      {/* Save indicator */}
      {!hydrated ? (
        <span className="text-xs text-[var(--text-muted)] mr-2">⏳ Loading from Firestore…</span>
      ) : sync.status === "saving" ? (
        <span className="text-xs text-[var(--text-muted)] mr-2">⏳ Saving to Firestore…</span>
      ) : sync.status === "restoring" ? (
        <span className="text-xs text-[var(--text-muted)] mr-2">⏳ Restoring from Firestore…</span>
      ) : sync.status === "restored" ? (
        <span className="text-xs text-green-400 mr-2">✓ Restored from Firestore {sync.at}</span>
      ) : sync.status === "synced" ? (
        <span className="text-xs text-green-400 mr-2">✓ Saved to roadmap-company {sync.at}</span>
      ) : sync.status === "error" ? (
        <span className="text-xs text-red-400 mr-2 max-w-[340px] truncate" title={sync.error}>
          ⚠ Firestore: {sync.error}
          {sync.unchanged ? "" : " (saved locally)"}
        </span>
      ) : savedAt ? (
        <span className="text-xs text-green-400 mr-2">✓ Saved to Storage {savedAt}</span>
      ) : null}

      {/* Auth */}
      {user && (
        <div className="flex items-center gap-1.5 mr-2">
          <span className="text-xs text-[var(--text-muted)] truncate max-w-[160px]" title={user.email ?? undefined}>
            {user.email}
          </span>
          <button
            onClick={async () => {
              await signOutUser();
              window.location.reload();
            }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white hover:bg-[#333]"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={handleSave}
        disabled={!hydrated || sync.status === "saving" || sync.status === "restoring"}
        className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333] disabled:opacity-50"
      >
        <span className="text-[14px]">💾</span> Save
      </button>
      <button
        onClick={handleReset}
        disabled={!hydrated || sync.status === "saving" || sync.status === "restoring"}
        title="Discard unsaved changes and restore the last Firestore save"
        className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333] disabled:opacity-50"
      >
        <span className="text-[14px]">🔄</span> Reset
      </button>
      <button onClick={() => fileRef.current?.click()} className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]">
        <span className="text-[14px]">📥</span> Import
      </button>
      <button onClick={handleExport} className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]">
        <span className="text-[14px]">📤</span> Export
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </header>
    <Modal
      open={permissionWarning !== null}
      onClose={() => setPermissionWarning(null)}
      title="Missing permission"
      width="max-w-sm"
    >
      <p className="text-xs text-white leading-relaxed">{permissionWarning}</p>
      <div className="flex justify-end mt-4">
        <button className={btnSecondary} onClick={() => setPermissionWarning(null)}>
          Close
        </button>
      </div>
    </Modal>
    </>
  );
}
