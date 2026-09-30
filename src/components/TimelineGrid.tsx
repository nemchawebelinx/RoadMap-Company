"use client";
import React from "react";
import { Horizon } from "@/lib/layout";
import { addDays, isWeekend } from "@/lib/date";

interface TimelineGridProps {
  horizon: Horizon;
  dayWidth: number;
  height: number;
}

export function TimelineGrid({ horizon, dayWidth, height }: TimelineGridProps) {
  const cols: { idx: number; isWeekday: boolean }[] = [];
  for (let i = 0; i < horizon.totalDays; i++) {
    const d = addDays(horizon.start, i);
    cols.push({ idx: i, isWeekday: !isWeekend(d) });
  }

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: horizon.totalDays * dayWidth, height }}
    >
      {cols.map((c) => (
        <div
          key={c.idx}
          className="absolute top-0 border-r"
          style={{
            left: c.idx * dayWidth,
            width: dayWidth,
            height: "100%",
            backgroundColor: c.isWeekday ? "rgba(255,255,255,0.015)" : "transparent",
            borderColor: "rgba(255,255,255,0.03)",
          }}
        />
      ))}
    </div>
  );
}
