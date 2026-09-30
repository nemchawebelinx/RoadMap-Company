import { Task, Milestone } from "./types";
import { parseDate, diffDays, startOfMonth, endOfMonth, addDays, formatDate } from "./date";

export interface Horizon {
  start: Date;
  end: Date;
  totalDays: number;
}

export function computeHorizon(tasks: Task[], milestones: Milestone[]): Horizon {
  const dates: Date[] = [];
  for (const t of tasks) {
    const s = parseDate(t.startDate);
    dates.push(s);
    dates.push(addDays(s, t.durationDays));
  }
  for (const m of milestones) {
    dates.push(parseDate(m.date));
  }
  // Add today
  dates.push(new Date());

  if (dates.length === 0) {
    const today = new Date();
    return {
      start: startOfMonth(addDays(today, -30)),
      end: endOfMonth(addDays(today, 90)),
      totalDays: 120,
    };
  }

  let min = dates[0],
    max = dates[0];
  for (const d of dates) {
    if (d < min) min = d;
    if (d > max) max = d;
  }

  // Pad to whole months + 1 month each side
  const start = startOfMonth(addDays(min, -30));
  const end = endOfMonth(addDays(max, 30));
  return { start, end, totalDays: diffDays(end, start) + 1 };
}

export function dayIndex(horizon: Horizon, dateStr: string): number {
  return diffDays(parseDate(dateStr), horizon.start);
}

export function dayIndexFromDate(horizon: Horizon, d: Date): number {
  return diffDays(d, horizon.start);
}

export interface StackedTask {
  task: Task;
  row: number;
  left: number; // dayIndex
  width: number; // days
}

export function stackTasks(tasks: Task[], horizon: Horizon): StackedTask[] {
  const sorted = [...tasks].sort(
    (a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime()
  );
  const rows: number[][] = []; // each row tracks end-dayIndex of placed tasks

  return sorted.map((task) => {
    const left = dayIndex(horizon, task.startDate);
    const right = left + task.durationDays;
    let row = 0;
    while (row < rows.length) {
      if (rows[row].every((endDay) => endDay <= left)) break;
      row++;
    }
    if (row >= rows.length) rows.push([]);
    rows[row].push(right);
    return { task, row, left, width: task.durationDays };
  });
}

export interface PackedFlag {
  milestone: Milestone | null; // null = today marker
  x: number; // px position
  row: number;
  isToday?: boolean;
  label: string;
}

export function packMilestoneFlags(
  milestones: Milestone[],
  horizon: Horizon,
  dayWidth: number,
  flagWidthEstimate = 80
): { flags: PackedFlag[]; rows: number } {
  const items: { x: number; width: number; milestone: Milestone | null; label: string; isToday?: boolean }[] = [];

  // Today
  const todayIdx = dayIndexFromDate(horizon, new Date());
  items.push({
    x: todayIdx * dayWidth,
    width: 60,
    milestone: null,
    label: "TODAY",
    isToday: true,
  });

  for (const m of milestones) {
    const idx = dayIndex(horizon, m.date);
    const labelWidth = Math.max(flagWidthEstimate, m.title.length * 7 + 20);
    items.push({ x: idx * dayWidth, width: labelWidth, milestone: m, label: m.title });
  }

  // Sort by x
  items.sort((a, b) => a.x - b.x);

  // Interval packing
  const rowEnds: number[] = [];
  const packed: PackedFlag[] = [];
  for (const item of items) {
    let row = 0;
    while (row < rowEnds.length && rowEnds[row] > item.x) {
      row++;
    }
    if (row >= rowEnds.length) rowEnds.push(0);
    rowEnds[row] = item.x + item.width + 4;
    packed.push({
      milestone: item.milestone,
      x: item.x,
      row,
      isToday: item.isToday,
      label: item.label,
    });
  }

  return { flags: packed, rows: rowEnds.length };
}

export function todayPixelOffset(horizon: Horizon, dayWidth: number): number {
  return dayIndexFromDate(horizon, new Date()) * dayWidth;
}
