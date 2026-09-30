"use client";
import React, { useRef } from "react";
import { useStore } from "@/lib/store";
import { ViewMode, ZOOM_PRESETS, MIN_CARD_HEIGHT, MAX_CARD_HEIGHT } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { saveToFirestore } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";

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
  const importState = useStore((s) => s.importState);
  const resetState = useStore((s) => s.resetState);
  const getExportData = useStore((s) => s.getExportData);
  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveDayWidth = dayWidth * (zoomPercent / 100);

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
    const data = getExportData();
    localStorage.setItem("visionary-suite-state", JSON.stringify(data));
    if (isFirebaseConfigured()) {
      const ok = await saveToFirestore(data);
      if (!ok) alert("Firestore save failed – saved to localStorage only.");
    }
    useStore.setState({ savedAt: new Date().toLocaleTimeString("en-GB", { hour12: false }) });
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
    <header className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-sm shrink-0 flex-wrap min-h-[40px]">
      {/* App name */}
      <span className="font-bold text-white mr-2">VisionarySuite</span>

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

      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      {/* Today button */}
      <button
        onClick={onCenterToday}
        className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]"
      >
        📍 Today
      </button>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 ml-1">
        <span className="text-[var(--text-muted)] text-xs">🔍</span>
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
        <button onClick={handleZoomOut} className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs hover:bg-[#333]">−</button>
        <button onClick={handleZoomIn} className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs hover:bg-[#333]">+</button>
      </div>

      {/* Card height */}
      <div className="flex items-center gap-1 ml-1">
        <span className="text-[var(--text-muted)] text-xs">{cardHeight}px</span>
        <button
          onClick={() => setCardHeight(Math.max(MIN_CARD_HEIGHT, cardHeight - 4))}
          className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs hover:bg-[#333]"
        >−</button>
        <button
          onClick={() => setCardHeight(Math.min(MAX_CARD_HEIGHT, cardHeight + 4))}
          className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs hover:bg-[#333]"
        >+</button>
      </div>

      <div className="flex-1" />

      {/* Save indicator */}
      {savedAt && (
        <span className="text-xs text-green-400 mr-2">
          ✓ Saved to Storage {savedAt}
        </span>
      )}

      {/* Actions */}
      <button onClick={handleSave} className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]">
        💾 Save
      </button>
      <button onClick={resetState} className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]">
        🔄 Reset
      </button>
      <button onClick={() => fileRef.current?.click()} className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]">
        📥 Import
      </button>
      <button onClick={handleExport} className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs hover:bg-[#333]">
        📤 Export
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </header>
  );
}
