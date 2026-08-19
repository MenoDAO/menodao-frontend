"use client";

import { CareIntelligenceDashboard, CareLoopStage } from "@/lib/care-intelligence";
import { emptyLabel, formatNumber, formatPct, formatPctChange } from "./format";
import { AlertTriangle, HelpCircle } from "lucide-react";

function conversionBetween(
  stages: CareLoopStage[],
  fromId: string,
  toId: string,
): number | null {
  const from = stages.find((s) => s.id === fromId);
  const to = stages.find((s) => s.id === toId);
  if (!from?.count || from.count <= 0 || to?.count == null) return null;
  if (!from.tracked || !to.tracked) return null;
  return to.count / from.count;
}

function conversionClass(conv: number | null): string {
  if (conv != null && conv < 0.2) return "text-red-400";
  if (conv != null && conv < 0.5) return "text-amber-300";
  return "text-gray-400";
}

function stageMark(stage: CareLoopStage, isWeak: boolean, empty: string | null) {
  if (isWeak) return { label: "Bottleneck", className: "border-amber-400/40 bg-amber-500/15 text-amber-300" };
  if (!stage.tracked || stage.dataStatus === "not_tracked") {
    return { label: "Not tracked", className: "border-gray-600 bg-gray-800 text-gray-400" };
  }
  if (empty || stage.dataStatus === "insufficient") {
    return { label: "Needs data", className: "border-sky-500/30 bg-sky-500/10 text-sky-300" };
  }
  return { label: "Tracked", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
}

export function CareLoop({ data }: { data: CareIntelligenceDashboard }) {
  const weakest = data.careLoop.bottleneck.ranked?.transitionId;
  const stages = data.careLoop.stages;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Care loop</h2>
        <p className="text-sm text-gray-400">
          Ranked from first touch to referral. Absolute numbers show scale.
          Conversion ratios show where the system is failing.
        </p>
      </div>

      <ol className="rounded-2xl border border-gray-700 bg-gray-800 p-4 sm:p-5">
        {stages.map((stage, index) => {
          const prev = stages[index - 1];
          const conv = prev
            ? conversionBetween(stages, prev.id, stage.id)
            : null;
          const empty =
            emptyLabel(stage.dataStatus) ||
            (!stage.tracked ? stage.untrackedReason : null);
          const isWeak =
            weakest?.includes(stage.id) ||
            (weakest === "registration_to_paid" && stage.id === "paid");
          const mark = stageMark(stage, isWeak, empty);
          const rank = String(index + 1).padStart(2, "0");

          return (
            <li key={stage.id}>
              {index > 0 && (
                <div className="flex items-center gap-3 py-2 pl-4 sm:pl-5">
                  <div className="flex w-10 flex-col items-center" aria-hidden>
                    <span className="h-3 w-px bg-gray-600" />
                    <span className="text-gray-500">↓</span>
                    <span className="h-3 w-px bg-gray-600" />
                  </div>
                  <p className={`text-xs font-medium ${conversionClass(conv)}`}>
                    {conv == null ? "No conversion yet" : `${formatPct(conv)} convert to next step`}
                    {prev ? (
                      <span className="ml-1 text-gray-500">
                        from {prev.label}
                      </span>
                    ) : null}
                  </p>
                </div>
              )}

              <div
                className={`flex items-start gap-3 rounded-xl border p-3 sm:p-4 ${
                  isWeak
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-gray-700 bg-gray-900/60"
                }`}
                title={stage.definition}
              >
                <div className="flex w-10 shrink-0 flex-col items-center pt-0.5">
                  <span className="text-[11px] font-bold tabular-nums text-gray-500">
                    {rank}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {stage.label}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${mark.className}`}
                    >
                      {mark.label}
                    </span>
                  </div>
                  {empty ? (
                    <p className="mt-2 text-sm text-gray-500">{empty}</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="text-2xl font-semibold text-white">
                        {formatNumber(stage.count)}
                      </p>
                      {stage.changePct != null && (
                        <p className="text-[11px] text-gray-500">
                          {formatPctChange(stage.changePct)} vs prior
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{stage.definition}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" aria-hidden />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
              Current bottleneck
            </p>
            <p className="mt-1 text-lg font-medium text-white">
              {data.careLoop.bottleneck.headline}
            </p>
            <p className="mt-2 text-sm text-gray-300">{data.careLoop.bottleneck.detail}</p>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {data.careLoop.bottleneck.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
