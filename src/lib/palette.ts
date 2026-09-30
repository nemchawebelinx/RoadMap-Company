// Maps Tailwind-style color tokens to hex values
const PALETTE: Record<string, string> = {
  "red-500": "#ef4444",
  "orange-500": "#f97316",
  "amber-500": "#f59e0b",
  "yellow-500": "#eab308",
  "lime-500": "#84cc16",
  "green-500": "#22c55e",
  "emerald-500": "#10b981",
  "teal-500": "#14b8a6",
  "cyan-500": "#06b6d4",
  "sky-500": "#0ea5e9",
  "blue-500": "#3b82f6",
  "indigo-500": "#6366f1",
  "violet-500": "#8b5cf6",
  "purple-500": "#a855f7",
  "fuchsia-500": "#d946ef",
  "pink-500": "#ec4899",
  "rose-500": "#f43f5e",
  "stone-500": "#78716c",
  "white": "#ffffff",
  "slate-500": "#64748b",
};

export const PALETTE_COLORS = Object.keys(PALETTE);

export function colorToHex(token: string): string {
  // Strip "bg-" prefix if present
  const cleaned = token.startsWith("bg-") ? token.slice(3) : token;
  return PALETTE[cleaned] || "#78716c";
}

export function colorToRgba(token: string, alpha: number): string {
  const hex = colorToHex(token);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
