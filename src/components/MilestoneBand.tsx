"use client";
import React from "react";
import { Milestone } from "@/lib/types";
import { Horizon, packMilestoneFlags } from "@/lib/layout";
import { colorToHex } from "@/lib/palette";

interface MilestoneBandProps {
  milestones: Milestone[];
  horizon: Horizon;
  dayWidth: number;
  onClickMilestone: (m: Milestone) => void;
}

interface MilestoneGuidesProps {
  milestones: Milestone[];
  horizon: Horizon;
  dayWidth: number;
  height: number;
}

const FLAG_ROW_HEIGHT = 22;

function flagColor(f: { isToday?: boolean; milestone: Milestone | null }): string {
  return f.isToday ? "#22c55e" : f.milestone ? colorToHex(f.milestone.color) : "#666";
}

export function MilestoneBand({
  milestones,
  horizon,
  dayWidth,
  onClickMilestone,
}: MilestoneBandProps) {
  const { flags, rows } = packMilestoneFlags(milestones, horizon, dayWidth);
  const bandHeight = Math.max(FLAG_ROW_HEIGHT, rows * FLAG_ROW_HEIGHT);

  return (
    <div className="relative" style={{ height: bandHeight, width: horizon.totalDays * dayWidth }}>
      {flags.map((f, i) => (
        <div
          key={i}
          className="absolute flex items-center cursor-pointer"
          style={{
            left: f.x,
            top: f.row * FLAG_ROW_HEIGHT,
            height: FLAG_ROW_HEIGHT,
          }}
          onClick={() => {
            if (f.milestone) onClickMilestone(f.milestone);
          }}
        >
          <div
            className="px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
            style={{
              backgroundColor: flagColor(f),
              color: f.isToday ? "#000" : "#fff",
            }}
          >
            {f.isToday ? "TODAY" : f.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MilestoneGuides({ milestones, horizon, dayWidth, height }: MilestoneGuidesProps) {
  const { flags } = packMilestoneFlags(milestones, horizon, dayWidth);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: horizon.totalDays * dayWidth, height }}
    >
      {flags.map((f, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: f.x,
            width: 1,
            height: "100%",
            borderLeft: `1px dashed ${flagColor(f)}`,
            opacity: f.isToday ? 0.6 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

export function getMilestoneBandHeight(milestones: Milestone[], horizon: Horizon, dayWidth: number): number {
  const { rows } = packMilestoneFlags(milestones, horizon, dayWidth);
  return Math.max(FLAG_ROW_HEIGHT, rows * FLAG_ROW_HEIGHT);
}
