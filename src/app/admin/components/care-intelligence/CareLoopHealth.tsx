"use client";

import { CareIntelligenceDashboard, HealthStatus } from "@/lib/care-intelligence";
import { healthClasses } from "./format";
import { CheckCircle2, CircleAlert, CircleHelp, Clock3, Eye } from "lucide-react";

const ICONS: Record<HealthStatus, typeof CheckCircle2> = {
  GOOD: CheckCircle2,
  WATCH: Eye,
  NEEDS_WORK: CircleAlert,
  NEEDS_DATA: CircleHelp,
  EARLY: Clock3,
};

export function CareLoopHealth({
  rows,
}: {
  rows: CareIntelligenceDashboard["careLoopHealth"];
}) {
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Care loop health</h2>
      <p className="mt-1 text-sm text-gray-400">
        Status comes from configurable targets, not invented scores.
      </p>
      <ul className="mt-4 divide-y divide-gray-700">
        {rows.map((row) => {
          const Icon = ICONS[row.status];
          return (
            <li key={row.key} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-white">{row.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{row.reason}</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${healthClasses(row.status)}`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {row.status.replace("_", " ")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
