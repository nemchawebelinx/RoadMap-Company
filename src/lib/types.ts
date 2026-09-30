export interface Layer {
  id: string;
  name: string;
  color: string;
  description: string;
  isHidden: boolean;
  order: number;
}

export interface TaskAssignee {
  resourceId: string;
  percentage: number;
  startOffsetDays: number;
  durationDays: number;
}

export interface Task {
  id: string;
  layerId: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  priority: string;
  assigneeIds: string[];
  assignees: TaskAssignee[];
}

export interface Milestone {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  color: string;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  isHidden: boolean;
  order: number;
}

export interface Resource {
  id: string;
  departmentId: string;
  name: string;
  picture: string;
  availableHours: number;
  position: string;
  notes: string;
  isHidden: boolean;
}

export interface PriorityMark {
  id: string;
  color: string; // e.g. "bg-red-500"
  label: string;
}

export interface ProjectState {
  layers: Layer[];
  tasks: Task[];
  milestones: Milestone[];
  departments: Department[];
  resources: Resource[];
  priorityMarks: PriorityMark[];
}

export type ViewMode = "roadmap" | "resources";

export interface ZoomPreset {
  label: string;
  dayWidth: number;
}

export const ZOOM_PRESETS: ZoomPreset[] = [
  { label: "Year", dayWidth: 4 },
  { label: "Quarter", dayWidth: 8 },
  { label: "Compact", dayWidth: 16 },
  { label: "Standard", dayWidth: 38 },
  { label: "Detailed", dayWidth: 55 },
  { label: "Expanded", dayWidth: 80 },
];

export const DEFAULT_DAY_WIDTH = 38;
export const MIN_CARD_HEIGHT = 18;
export const MAX_CARD_HEIGHT = 60;
export const DEFAULT_CARD_HEIGHT = 28;
