"use client";
import React from "react";
import { Milestone } from "@/lib/types";
import { Horizon, packMilestoneFlags } from "@/lib/layout";
import { colorToHex } from "@/lib/palette";

interface MilestoneBandProps {
  milestones: Milestone[];
  horizon: Horizon;
  dayWidth: number;
  totalHeight: number;
  onClickMilestone: (m: Milestone) => void;
  onAddMilestone: () => void;
}

const FLAG_ROW_HEIGHT = 22;

export function MilestoneBand({
  milestones,
  horizon,
  dayWidth,
  totalHeight,
  onClickMilestone,
  onAddMilestone,
}: MilestoneBandProps) {
  const { flags, rows } = packMilestoneFlags(milestones, horizon, dayWidth);
  const bandHeight = Math.max(FLAG_ROW_HEIGHT, rows * FLAG_ROW_HEIGHT);

  return (
    <>
      {/* Flag band */}
      <div className="relative" style={{ height: bandHeight, width: horizon.totalDays * dayWidth }}>
        {flags.map((f, i) => {
          const color = f.isToday ? "#22c55e" : f.milestone ? colorToHex(f.milestone.color) : "#666";
          return (
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
                  backgroundColor: color,
                  color: f.isToday ? "#000" : "#fff",
                }}
              >
                {f.isToday ? "TODAY" : f.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vertical guide lines extending down */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: bandHeight,
          left: 0,
          width: horizon.totalDays * dayWidth,
          height: totalHeight,
        }}
      >
        {flags.map((f, i) => {
          const color = f.isToday ? "#22c55e" : f.milestone ? colorToHex(f.milestone.color) : "#666";
          return (
            <div
              key={i}
              className="absolute top-0"
              style={{
                left: f.x,
                width: 1,
                height: "100%",
                borderLeft: `1px dashed ${color}`,
                opacity: f.isToday ? 0.6 : 0.3,
              }}
            />
          );
        })}
      </div>
    </>
  );
}

export function getMilestoneBandHeight(milestones: Milestone[], horizon: Horizon, dayWidth: number): number {
  const { rows } = packMilestoneFlags(milestones, horizon, dayWidth);
  return Math.max(FLAG_ROW_HEIGHT, rows * FLAG_ROW_HEIGHT);
}
