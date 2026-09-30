import { create } from "zustand";
import {
  ProjectState,
  Layer,
  Task,
  Milestone,
  Department,
  Resource,
  ViewMode,
  DEFAULT_DAY_WIDTH,
  DEFAULT_CARD_HEIGHT,
} from "./types";
import { emptyState, normalizeProjectState } from "./schema";

const STORAGE_KEY = "webelinx-roadmap-state";

interface AppState extends ProjectState {
  // UI state
  viewMode: ViewMode;
  dayWidth: number;
  cardHeight: number;
  zoomPercent: number;
  savedAt: string | null;
  hydrated: boolean;

  // Actions
  setViewMode: (v: ViewMode) => void;
  hydrateFromRemote: (state: ProjectState | null) => void;
  setDayWidth: (w: number) => void;
  setCardHeight: (h: number) => void;
  setZoomPercent: (p: number) => void;

  // Import / reset
  importState: (raw: unknown) => void;
  resetState: () => void;
  getExportData: () => ProjectState;

  // Layer CRUD
  addLayer: (l: Layer) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayer: (id: string, direction: "up" | "down") => void;
  toggleLayerHidden: (id: string) => void;

  // Task CRUD
  addTask: (t: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskToLayer: (taskId: string, layerId: string) => void;

  // Milestone CRUD
  addMilestone: (m: Milestone) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;

  // Department CRUD
  addDepartment: (d: Department) => void;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  reorderDepartment: (id: string, direction: "up" | "down") => void;
  toggleDepartmentHidden: (id: string) => void;

  // Resource CRUD
  addResource: (r: Resource) => void;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  toggleResourceHidden: (id: string) => void;
}

function persist(state: ProjectState) {
  try {
    const data: ProjectState = {
      layers: state.layers,
      tasks: state.tasks,
      milestones: state.milestones,
      departments: state.departments,
      resources: state.resources,
      priorityMarks: state.priorityMarks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadFromStorage(): ProjectState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeProjectState(JSON.parse(raw));
  } catch {}
  return null;
}

function reorderItems<T extends { order: number; isHidden: boolean }>(
  items: T[],
  id: string,
  direction: "up" | "down",
  getId: (item: T) => string
): T[] {
  const visible = items.filter(i => !i.isHidden).sort((a, b) => a.order - b.order);
  const idx = visible.findIndex(i => getId(i) === id);
  if (idx < 0) return items;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= visible.length) return items;
  const tempOrder = visible[idx].order;
  visible[idx] = { ...visible[idx], order: visible[swapIdx].order };
  visible[swapIdx] = { ...visible[swapIdx], order: tempOrder };
  const map = new Map<string, number>();
  for (const v of visible) map.set(getId(v), v.order);
  return items.map(i => {
    const newOrder = map.get(getId(i));
    return newOrder !== undefined ? { ...i, order: newOrder } : i;
  });
}

const now = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

export const useStore = create<AppState>((set, get) => {
  const initial = loadFromStorage() || emptyState();
  return {
    ...initial,
    viewMode: "roadmap",
    dayWidth: DEFAULT_DAY_WIDTH,
    cardHeight: DEFAULT_CARD_HEIGHT,
    zoomPercent: 100,
    savedAt: null,
    hydrated: false,

    setViewMode: (v) => set({ viewMode: v }),

    // Firestore is the shared source of truth, so it wins over the localStorage
    // copy. A null argument means Firebase is unconfigured or the fetch failed –
    // keep whatever localStorage gave us and just unblock the UI.
    hydrateFromRemote: (state) => {
      if (!state) {
        set({ hydrated: true });
        return;
      }
      set({ ...state, hydrated: true });
      persist({ ...get(), ...state });
    },
    setDayWidth: (w) => set({ dayWidth: w }),
    setCardHeight: (h) => set({ cardHeight: h }),
    setZoomPercent: (p) => set({ zoomPercent: p }),

    importState: (raw) => {
      const state = normalizeProjectState(raw);
      set({ ...state, savedAt: now() });
      persist({ ...get(), ...state });
    },

    resetState: () => {
      const empty = emptyState();
      set({ ...empty, savedAt: null });
      localStorage.removeItem(STORAGE_KEY);
    },

    getExportData: () => {
      const s = get();
      return {
        layers: s.layers,
        tasks: s.tasks,
        milestones: s.milestones,
        departments: s.departments,
        resources: s.resources,
        priorityMarks: s.priorityMarks,
      };
    },

    // Layers
    addLayer: (l) => set(s => {
      const next = { layers: [...s.layers, l] };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    updateLayer: (id, patch) => set(s => {
      const next = { layers: s.layers.map(l => l.id === id ? { ...l, ...patch } : l) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    deleteLayer: (id) => set(s => {
      const next = {
        layers: s.layers.filter(l => l.id !== id),
        tasks: s.tasks.filter(t => t.layerId !== id),
      };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    reorderLayer: (id, direction) => set(s => {
      const next = { layers: reorderItems(s.layers, id, direction, l => l.id) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    toggleLayerHidden: (id) => set(s => {
      const next = {
        layers: s.layers.map(l => l.id === id ? { ...l, isHidden: !l.isHidden } : l),
      };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),

    // Tasks
    addTask: (t) => set(s => {
      const next = { tasks: [...s.tasks, t] };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    updateTask: (id, patch) => set(s => {
      const next = { tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    deleteTask: (id) => set(s => {
      const next = { tasks: s.tasks.filter(t => t.id !== id) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    moveTaskToLayer: (taskId, layerId) => set(s => {
      const next = { tasks: s.tasks.map(t => t.id === taskId ? { ...t, layerId } : t) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),

    // Milestones
    addMilestone: (m) => set(s => {
      const next = { milestones: [...s.milestones, m] };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    updateMilestone: (id, patch) => set(s => {
      const next = { milestones: s.milestones.map(m => m.id === id ? { ...m, ...patch } : m) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    deleteMilestone: (id) => set(s => {
      const next = { milestones: s.milestones.filter(m => m.id !== id) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),

    // Departments
    addDepartment: (d) => set(s => {
      const next = { departments: [...s.departments, d] };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    updateDepartment: (id, patch) => set(s => {
      const next = { departments: s.departments.map(d => d.id === id ? { ...d, ...patch } : d) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    deleteDepartment: (id) => set(s => {
      const next = {
        departments: s.departments.filter(d => d.id !== id),
        resources: s.resources.filter(r => r.departmentId !== id),
      };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    reorderDepartment: (id, direction) => set(s => {
      const next = { departments: reorderItems(s.departments, id, direction, d => d.id) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    toggleDepartmentHidden: (id) => set(s => {
      const next = {
        departments: s.departments.map(d => d.id === id ? { ...d, isHidden: !d.isHidden } : d),
      };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),

    // Resources
    addResource: (r) => set(s => {
      const next = { resources: [...s.resources, r] };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    updateResource: (id, patch) => set(s => {
      const next = { resources: s.resources.map(r => r.id === id ? { ...r, ...patch } : r) };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    deleteResource: (id) => set(s => {
      const next = {
        resources: s.resources.filter(r => r.id !== id),
        tasks: s.tasks.map(t => ({
          ...t,
          assignees: t.assignees.filter(a => a.resourceId !== id),
          assigneeIds: t.assigneeIds.filter(aid => aid !== id),
        })),
      };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
    toggleResourceHidden: (id) => set(s => {
      const next = {
        resources: s.resources.map(r => r.id === id ? { ...r, isHidden: !r.isHidden } : r),
      };
      persist({ ...s, ...next });
      return { ...next, savedAt: now() };
    }),
  };
});
