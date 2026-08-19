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

export function CareLoop({ data }: { data: CareIntelligenceDashboard }) {
  const weakest = data.careLoop.bottleneck.ranked?.transitionId;
  const stages = data.careLoop.stages;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Care loop</h2>
        <p className="text-sm text-gray-400">
          Absolute numbers show scale. Conversion ratios show where the system is failing.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-700 bg-gray-800 p-4">
        <div className="flex min-w-max items-stretch gap-2">
          {stages.map((stage, index) => {
            const prev = stages[index - 1];
            const conv = prev
              ? conversionBetween(stages, prev.id, stage.id)
              : null;
            const empty = emptyLabel(stage.dataStatus) || (!stage.tracked ? stage.untrackedReason : null);
            const isWeak =
              weakest?.includes(stage.id) ||
              (weakest === "registration_to_paid" && stage.id === "paid");
            return (
              <div key={stage.id} className="flex items-stretch gap-2">
                {index > 0 && (
                  <div className="flex w-16 flex-col items-center justify-center text-center">
                    <span className="text-gray-500">↓</span>
                    <span
                      className={`text-xs font-medium ${
                        conv != null && conv < 0.2
                          ? "text-red-400"
                          : conv != null && conv < 0.5
                            ? "text-amber-300"
                            : "text-gray-400"
                      }`}
                    >
                      {conv == null ? "—" : formatPct(conv)}
                    </span>
                  </div>
                )}
                <div
                  className={`w-36 rounded-xl border p-3 ${
                    isWeak
                      ? "border-amber-400 bg-amber-500/10"
                      : "border-gray-700 bg-gray-900/60"
                  }`}
                  title={stage.definition}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {stage.label}
                  </p>
                  {empty ? (
                    <p className="mt-2 text-xs text-gray-500">{empty}</p>
                  ) : (
                    <>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {formatNumber(stage.count)}
                      </p>
                      {stage.changePct != null && (
                        <p className="mt-1 text-[11px] text-gray-500">
                          {formatPctChange(stage.changePct)} vs prior
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
