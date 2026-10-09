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
import { loadFromFirestore } from "@/lib/firestore";
import { signOutUser } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";

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
  const hydrated = useStore((s) => s.hydrated);
  const hydrateFromRemote = useStore((s) => s.hydrateFromRemote);

  const effectiveDayWidth = dayWidth * (zoomPercent / 100);

  const horizon = useMemo(() => computeHorizon(tasks, milestones), [tasks, milestones]);

  const [milestoneModal, setMilestoneModal] = useState<{
    open: boolean;
    milestone: Milestone | null;
  }>({ open: false, milestone: null });

  const [mounted, setMounted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    loadFromFirestore().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        hydrateFromRemote(result.state);
      } else if (result.denied) {
        setAccessDenied(true);
      } else {
        // Network or other error — fall back to localStorage
        hydrateFromRemote(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hydrateFromRemote]);

  const centerToday = () => {
    if (!scrollRef.current) return;
    const todayPx = todayPixelOffset(horizon, effectiveDayWidth);
    const viewportWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = todayPx - viewportWidth / 2 + RAIL_WIDTH / 2;
  };

  // Center today on mount only – re-centering on every horizon change would fight
  // the user while dragging a task, since each drag update recomputes the horizon.
  // Wait for hydration, otherwise we would center against the empty horizon and
  // end up scrolled to the wrong date once the real tasks arrive.
  useEffect(() => {
    if (!mounted || !hydrated) return;
    const timer = setTimeout(centerToday, 100);
    return () => clearTimeout(timer);
  }, [mounted, hydrated]);

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

  if (accessDenied) {
    const auth = getFirebaseAuth();
    const email = auth?.currentUser?.email ?? "your account";
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] max-w-sm w-full">
          <h1 className="text-white text-lg font-bold">Access Denied</h1>
          <p className="text-[var(--text-muted)] text-sm text-center">
            <span className="text-white font-medium">{email}</span> is not authorized to access this roadmap.
          </p>
          <button
            onClick={async () => {
              await signOutUser();
              window.location.reload();
            }}
            className="px-4 py-2 rounded bg-[var(--bg-tertiary)] text-white text-sm hover:bg-[#333] transition-colors"
          >
            Sign out and try a different account
          </button>
        </div>
      </div>
    );
  }

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
            {/* Grid background */}
            <div style={{ position: "absolute", left: RAIL_WIDTH, top: 0, width: totalWidth }}>
              <TimelineGrid horizon={horizon} dayWidth={effectiveDayWidth} height={5000} />
            </div>

            {/* Guide lines draw over the task cards. They share the sticky rails'
                z-index and come first, so the rails still cover them when scrolled. */}
            <div
              className="z-20"
              style={{ position: "absolute", left: RAIL_WIDTH, top: 0, width: totalWidth }}
            >
              <MilestoneGuides
                milestones={milestones}
                horizon={horizon}
                dayWidth={effectiveDayWidth}
                height={5000}
              />
            </div>

            {/* View content – must stay z-auto so the rails inside it are not
                trapped below the guide overlay. */}
            <div className="relative">
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
