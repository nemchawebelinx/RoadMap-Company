import { ProjectState, Layer, Task, Milestone, Department, Resource, PriorityMark, TaskAssignee } from "./types";

const DEFAULT_PRIORITY_MARKS: PriorityMark[] = [
  { id: "high", color: "bg-red-500", label: "High Priority" },
  { id: "mid", color: "bg-orange-500", label: "Mid Priority" },
  { id: "low", color: "bg-yellow-500", label: "Low Priority" },
];

function ensureString(v: unknown, def = ""): string {
  return typeof v === "string" ? v : def;
}
function ensureNumber(v: unknown, def = 0): number {
  return typeof v === "number" && !isNaN(v) ? v : def;
}
function ensureBool(v: unknown, def = false): boolean {
  return typeof v === "boolean" ? v : def;
}

function normalizeAssignee(a: unknown, taskDuration: number): TaskAssignee | null {
  if (!a || typeof a !== "object") return null;
  const obj = a as Record<string, unknown>;
  const resourceId = ensureString(obj.resourceId);
  if (!resourceId) return null;
  const startOffsetDays = ensureNumber(obj.startOffsetDays, 0);
  const percentage = ensureNumber(obj.percentage, 100);
  const durationDays = ensureNumber(obj.durationDays, taskDuration - startOffsetDays);
  return { resourceId, percentage, startOffsetDays, durationDays };
}

function normalizeLayer(l: unknown, idx: number): Layer | null {
  if (!l || typeof l !== "object") return null;
  const obj = l as Record<string, unknown>;
  return {
    id: ensureString(obj.id, `layer-${Date.now()}-${idx}`),
    name: ensureString(obj.name, "Untitled Layer"),
    color: ensureString(obj.color, "purple-500"),
    description: ensureString(obj.description),
    isHidden: ensureBool(obj.isHidden),
    order: ensureNumber(obj.order, idx * 10),
  };
}

function normalizeTask(t: unknown): Task | null {
  if (!t || typeof t !== "object") return null;
  const obj = t as Record<string, unknown>;
  const id = ensureString(obj.id);
  if (!id) return null;
  const durationDays = ensureNumber(obj.durationDays, 1);
  const assignees = Array.isArray(obj.assignees)
    ? (obj.assignees.map(a => normalizeAssignee(a, durationDays)).filter(Boolean) as TaskAssignee[])
    : [];
  return {
    id,
    layerId: ensureString(obj.layerId),
    name: ensureString(obj.name, "Untitled Task"),
    description: ensureString(obj.description),
    startDate: ensureString(obj.startDate, "2026-01-01"),
    durationDays,
    priority: ensureString(obj.priority, "mid"),
    hasOutline: ensureBool(obj.hasOutline),
    outlineColor: ensureString(obj.outlineColor, "white"),
    assigneeIds: assignees.map(a => a.resourceId),
    assignees,
  };
}

function normalizeMilestone(m: unknown): Milestone | null {
  if (!m || typeof m !== "object") return null;
  const obj = m as Record<string, unknown>;
  return {
    id: ensureString(obj.id),
    title: ensureString(obj.title, "Milestone"),
    date: ensureString(obj.date, "2026-01-01"),
    color: ensureString(obj.color, "purple-500"),
    description: ensureString(obj.description),
  };
}

function normalizeDepartment(d: unknown, idx: number): Department | null {
  if (!d || typeof d !== "object") return null;
  const obj = d as Record<string, unknown>;
  return {
    id: ensureString(obj.id, `dep-${Date.now()}-${idx}`),
    name: ensureString(obj.name, "Untitled Department"),
    color: ensureString(obj.color, "blue-500"),
    isHidden: ensureBool(obj.isHidden),
    order: ensureNumber(obj.order, idx * 10),
  };
}

function normalizeResource(r: unknown): Resource | null {
  if (!r || typeof r !== "object") return null;
  const obj = r as Record<string, unknown>;
  return {
    id: ensureString(obj.id),
    departmentId: ensureString(obj.departmentId),
    name: ensureString(obj.name, "Unnamed"),
    picture: ensureString(obj.picture),
    availableHours: ensureNumber(obj.availableHours, 40),
    position: ensureString(obj.position),
    notes: ensureString(obj.notes),
    isHidden: ensureBool(obj.isHidden),
  };
}

export function normalizeProjectState(raw: unknown): ProjectState {
  if (!raw || typeof raw !== "object") return emptyState();
  const obj = raw as Record<string, unknown>;

  const layers = Array.isArray(obj.layers)
    ? (obj.layers.map((l, i) => normalizeLayer(l, i)).filter(Boolean) as Layer[])
    : [];
  const tasks = Array.isArray(obj.tasks)
    ? (obj.tasks.map(t => normalizeTask(t)).filter(Boolean) as Task[])
    : [];
  const milestones = Array.isArray(obj.milestones)
    ? (obj.milestones.map(m => normalizeMilestone(m)).filter(Boolean) as Milestone[])
    : [];
  const departments = Array.isArray(obj.departments)
    ? (obj.departments.map((d, i) => normalizeDepartment(d, i)).filter(Boolean) as Department[])
    : [];
  const resources = Array.isArray(obj.resources)
    ? (obj.resources.map(r => normalizeResource(r)).filter(Boolean) as Resource[])
    : [];
  const priorityMarks = Array.isArray(obj.priorityMarks) && obj.priorityMarks.length > 0
    ? (obj.priorityMarks.map(p => {
        if (!p || typeof p !== "object") return null;
        const pm = p as Record<string, unknown>;
        return {
          id: ensureString(pm.id),
          color: ensureString(pm.color, "bg-stone-500"),
          label: ensureString(pm.label),
        };
      }).filter(Boolean) as PriorityMark[])
    : DEFAULT_PRIORITY_MARKS;

  // Drop tasks referencing non-existent layers
  const layerIds = new Set(layers.map(l => l.id));
  const validTasks = tasks.filter(t => layerIds.has(t.layerId));

  // Drop assignees referencing non-existent resources
  const resourceIds = new Set(resources.map(r => r.id));
  for (const task of validTasks) {
    task.assignees = task.assignees.filter(a => resourceIds.has(a.resourceId));
    task.assigneeIds = task.assignees.map(a => a.resourceId);
  }

  return { layers, tasks: validTasks, milestones, departments, resources, priorityMarks };
}

export function emptyState(): ProjectState {
  return {
    layers: [],
    tasks: [],
    milestones: [],
    departments: [],
    resources: [],
    priorityMarks: DEFAULT_PRIORITY_MARKS,
  };
}
