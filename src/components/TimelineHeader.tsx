"use client";
import React from "react";
import { Horizon } from "@/lib/layout";
import { addDays, monthLabel, isWeekend } from "@/lib/date";

interface TimelineHeaderProps {
  horizon: Horizon;
  dayWidth: number;
}

export function TimelineHeader({ horizon, dayWidth }: TimelineHeaderProps) {
  // Generate months
  const months: { label: string; startIdx: number; days: number }[] = [];
  let cursor = new Date(horizon.start);
  while (cursor <= horizon.end) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startIdx = Math.max(
      0,
      Math.round((monthStart.getTime() - horizon.start.getTime()) / 86400000)
    );
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const label = monthLabel(cursor);
    months.push({ label, startIdx, days: daysInMonth });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  // Generate days
  const days: { date: Date; idx: number; dayNum: number; weekend: boolean }[] = [];
  for (let i = 0; i < horizon.totalDays; i++) {
    const d = addDays(horizon.start, i);
    days.push({ date: d, idx: i, dayNum: d.getDate(), weekend: isWeekend(d) });
  }

  return (
    <div className="sticky top-0 z-30 bg-[var(--bg)]">
      {/* Month row */}
      <div className="relative h-6 border-b border-[var(--border)]" style={{ width: horizon.totalDays * dayWidth }}>
        {months.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 h-full flex items-center px-2 text-[10px] font-bold text-[var(--text-muted)] border-l border-[var(--border)] uppercase tracking-wider"
            style={{ left: m.startIdx * dayWidth, width: m.days * dayWidth }}
          >
            {m.label}
          </div>
        ))}
      </div>
      {/* Day row */}
      <div className="relative h-5 border-b border-[var(--border)]" style={{ width: horizon.totalDays * dayWidth }}>
        {days.map((d) => (
          <div
            key={d.idx}
            className="absolute top-0 h-full flex items-center justify-center text-[9px] border-r"
            style={{
              left: d.idx * dayWidth,
              width: dayWidth,
              backgroundColor: d.weekend ? "transparent" : "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.05)",
              color: d.weekend ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.35)",
            }}
          >
            {dayWidth >= 14 ? d.dayNum : dayWidth >= 8 && d.dayNum % 5 === 0 ? d.dayNum : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
