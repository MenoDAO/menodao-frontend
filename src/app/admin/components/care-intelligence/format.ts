import { DataStatus, HealthStatus } from "@/lib/care-intelligence";

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("en-KE");
}

export function formatPct(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatPctChange(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDays(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)} days`;
}

export function formatMinutes(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)} min`;
}

export function formatKes(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `KSh ${Math.round(value).toLocaleString("en-KE")}`;
}

export function changeTone(value: number | null | undefined): "up" | "down" | "flat" {
  if (value == null || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

export function healthClasses(status: HealthStatus): string {
  switch (status) {
    case "GOOD":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "WATCH":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "NEEDS_WORK":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "EARLY":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    default:
      return "bg-gray-500/15 text-gray-300 border-gray-500/30";
  }
}

export function emptyLabel(status: DataStatus | string | undefined): string | null {
  if (status === "not_tracked") return "Not tracked yet";
  if (status === "insufficient") return "Not enough data yet";
  return null;
}

export function sparkBars(values: number[]): string {
  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const max = Math.max(...values, 1);
  return values
    .map((v) => blocks[Math.min(blocks.length - 1, Math.round((v / max) * (blocks.length - 1)))])
    .join("");
}

export function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
