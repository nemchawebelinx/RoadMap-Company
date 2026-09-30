"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { computeHorizon, todayPixelOffset } from "@/lib/layout";
import { getMilestoneBandHeight, MilestoneBand } from "./MilestoneBand";
import { TimelineHeader } from "./TimelineHeader";
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

  // Center today on mount
  useEffect(() => {
    if (mounted) {
      setTimeout(centerToday, 100);
    }
  }, [mounted, horizon, effectiveDayWidth]);

  if (!mounted) return null;

  const totalWidth = horizon.totalDays * effectiveDayWidth;
  const milestoneBandHeight = getMilestoneBandHeight(milestones, horizon, effectiveDayWidth);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onCenterToday={centerToday} />

      {/* Milestone + add button bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
        <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
          Milestones
        </span>
        <span className="text-[9px] text-[var(--text-muted)]">{milestones.length}</span>
        <button
          className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[#333] rounded text-[var(--text-muted)] ml-1"
          onClick={() => setMilestoneModal({ open: true, milestone: null })}
        >
          +
        </button>
      </div>

      {/* Main scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative">
        <div style={{ width: totalWidth + RAIL_WIDTH, minHeight: "100%" }}>
          {/* Sticky left rail column takes up RAIL_WIDTH but timeline starts after it */}
          <div style={{ paddingLeft: RAIL_WIDTH }}>
            {/* Timeline header */}
            <TimelineHeader horizon={horizon} dayWidth={effectiveDayWidth} />

            {/* Milestone band */}
            <div className="relative" style={{ width: totalWidth }}>
              <MilestoneBand
                milestones={milestones}
                horizon={horizon}
                dayWidth={effectiveDayWidth}
                totalHeight={3000}
                onClickMilestone={(m) => setMilestoneModal({ open: true, milestone: m })}
                onAddMilestone={() => setMilestoneModal({ open: true, milestone: null })}
              />
            </div>
          </div>

          {/* Content area with grid */}
          <div className="relative">
            {/* Grid background */}
            <div style={{ position: "absolute", left: RAIL_WIDTH, top: 0, width: totalWidth }}>
              <TimelineGrid horizon={horizon} dayWidth={effectiveDayWidth} height={5000} />
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
