"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { computeHorizon, todayPixelOffset } from "@/lib/layout";
import { getMilestoneBandHeight, MilestoneBand, MilestoneGuides } from "./MilestoneBand";
import { TIMELINE_HEADER_HEIGHT, TimelineHeader } from "./TimelineHeader";
import { TimelineGrid } from "./TimelineGrid";
import { RoadmapView } from "./RoadmapView";
import { ResourcesView } from "./ResourcesView";
import { Header } from "./Header";
import { MilestoneModal } from "./MilestoneModal";
import { Milestone } from "@/lib/types";

const RAIL_WIDTH = 160;

export function App() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewMode = useStore((s) => s.viewMode);
  const tasks = useStore((s) => s.tasks);
  const milestones = useStore((s) => s.milestones);
  const dayWidth = useStore((s) => s.dayWidth);
  const zoomPercent = useStore((s) => s.zoomPercent);
  const cardHeight = useStore((s) => s.cardHeight);
  const addMilestone = useStore((s) => s.addMilestone);
  const updateMilestone = useStore((s) => s.updateMilestone);
  const deleteMilestone = useStore((s) => s.deleteMilestone);

  const effectiveDayWidth = dayWidth * (zoomPercent / 100);

  const horizon = useMemo(() => computeHorizon(tasks, milestones), [tasks, milestones]);

  const [milestoneModal, setMilestoneModal] = useState<{
    open: boolean;
    milestone: Milestone | null;
  }>({ open: false, milestone: null });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const centerToday = () => {
    if (!scrollRef.current) return;
    const todayPx = todayPixelOffset(horizon, effectiveDayWidth);
    const viewportWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = todayPx - viewportWidth / 2 + RAIL_WIDTH / 2;
  };

  // Center today on mount only – re-centering on every horizon change would fight
  // the user while dragging a task, since each drag update recomputes the horizon.
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(centerToday, 100);
    return () => clearTimeout(timer);
  }, [mounted]);

  // Keep the dates under the viewport in place when the horizon start shifts
  // (dragging the earliest task) or the day width changes (zooming).
  const anchorRef = useRef({ startMs: horizon.start.getTime(), dayWidth: effectiveDayWidth });
  const horizonStartMs = horizon.start.getTime();
  useEffect(() => {
    const el = scrollRef.current;
    const prev = anchorRef.current;
    anchorRef.current = { startMs: horizonStartMs, dayWidth: effectiveDayWidth };
    if (!el) return;
    if (prev.startMs === horizonStartMs && prev.dayWidth === effectiveDayWidth) return;

    const halfViewport = el.clientWidth / 2;
    const centerDay = (el.scrollLeft + halfViewport - RAIL_WIDTH) / prev.dayWidth;
    const shiftDays = Math.round((horizonStartMs - prev.startMs) / 86400000);
    el.scrollLeft =
      (centerDay - shiftDays) * effectiveDayWidth + RAIL_WIDTH - halfViewport;
  }, [horizonStartMs, effectiveDayWidth]);

  if (!mounted) return null;

  const totalWidth = horizon.totalDays * effectiveDayWidth;
  const milestoneBandHeight = getMilestoneBandHeight(milestones, horizon, effectiveDayWidth);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onCenterToday={centerToday} />

      {/* Main scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative">
        <div style={{ width: totalWidth + RAIL_WIDTH, minHeight: "100%" }}>
          {/* Timeline header row: empty rail corner + month/day scale */}
          <div className="sticky top-0 z-30 flex bg-[var(--bg)]">
            <div
              className="sticky left-0 z-40 shrink-0 border-r border-b border-[var(--border)] bg-[var(--bg)]"
              style={{ width: RAIL_WIDTH }}
            />
            <TimelineHeader horizon={horizon} dayWidth={effectiveDayWidth} />
          </div>

          {/* Milestone row: always the first row, pinned directly under the timeline */}
          <div
            className="sticky z-[25] flex"
            style={{ top: TIMELINE_HEADER_HEIGHT, minHeight: milestoneBandHeight }}
          >
            <div
              className="sticky left-0 z-20 shrink-0 border-r border-b border-[var(--border)] bg-[var(--bg)] flex flex-col justify-center px-2 py-1"
              style={{ width: RAIL_WIDTH, minHeight: milestoneBandHeight }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] shrink-0">⚑</span>
                <span className="text-xs font-medium text-white truncate">Milestones</span>
                <span className="text-[9px] text-[var(--text-muted)]">{milestones.length}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  className="text-[11px] px-1 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)]"
                  onClick={() => setMilestoneModal({ open: true, milestone: null })}
                  title="Add Milestone"
                >+</button>
              </div>
            </div>
            <div
              className="relative border-b border-[var(--border)] bg-[var(--bg)]"
              style={{ width: totalWidth, minHeight: milestoneBandHeight }}
            >
              <MilestoneBand
                milestones={milestones}
                horizon={horizon}
                dayWidth={effectiveDayWidth}
                onClickMilestone={(m) => setMilestoneModal({ open: true, milestone: m })}
              />
            </div>
          </div>

          {/* Content area with grid */}
          <div className="relative">
            {/* Grid background + milestone guide lines */}
            <div style={{ position: "absolute", left: RAIL_WIDTH, top: 0, width: totalWidth }}>
              <TimelineGrid horizon={horizon} dayWidth={effectiveDayWidth} height={5000} />
              <MilestoneGuides
                milestones={milestones}
                horizon={horizon}
                dayWidth={effectiveDayWidth}
                height={5000}
              />
            </div>

            {/* View content */}
            <div className="relative z-10">
              {viewMode === "roadmap" ? (
                <RoadmapView
                  horizon={horizon}
                  dayWidth={effectiveDayWidth}
                  cardHeight={cardHeight}
                  railWidth={RAIL_WIDTH}
                />
              ) : (
                <ResourcesView
                  horizon={horizon}
                  dayWidth={effectiveDayWidth}
                  cardHeight={cardHeight}
                  railWidth={RAIL_WIDTH}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Modal */}
      <MilestoneModal
        open={milestoneModal.open}
        onClose={() => setMilestoneModal({ open: false, milestone: null })}
        initial={milestoneModal.milestone}
        onSave={(data) => {
          if (milestoneModal.milestone) {
            updateMilestone(milestoneModal.milestone.id, data);
          } else {
            addMilestone({
              id: `milestone-${Date.now()}`,
              ...data,
            });
          }
        }}
      />
    </div>
  );
}
