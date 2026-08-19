"use client";

import { CareIntelligenceDashboard } from "@/lib/care-intelligence";
import {
  changeTone,
  emptyLabel,
  formatNumber,
  formatPctChange,
  sparkBars,
} from "./format";
import { ArrowDownRight, ArrowUpRight, Target } from "lucide-react";

export function NorthStar({ data }: { data: CareIntelligenceDashboard["northStar"] }) {
  const empty = emptyLabel(data.dataStatus);
  const tone = changeTone(data.momPct);
  const spark = sparkBars(data.trailing6m.map((m) => m.value));

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
        North star
      </p>
      <h2 className="mt-2 text-sm text-gray-400">{data.label}</h2>
      {empty ? (
        <p className="mt-6 text-lg text-gray-300">{empty}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-6xl font-semibold tracking-tight text-white sm:text-7xl">
              {formatNumber(data.current)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {data.momPct != null ? (
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    tone === "up"
                      ? "text-emerald-400"
                      : tone === "down"
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {tone === "down" ? (
                    <ArrowDownRight className="h-4 w-4" aria-hidden />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  )}
                  {formatPctChange(data.momPct)} vs previous period
                </span>
              ) : (
                <span className="text-gray-500">No prior baseline</span>
              )}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-1 text-gray-500">
                <Target className="h-3.5 w-3.5" aria-hidden />
                Target
              </dt>
              <dd className="mt-1 text-lg text-white">{formatNumber(data.target)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">3-month avg</dt>
              <dd className="mt-1 text-lg text-white">
                {data.trailing3mAvg != null ? formatNumber(data.trailing3mAvg) : "—"}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-gray-500">6-month trend</dt>
              <dd className="mt-1 font-mono text-2xl tracking-widest text-emerald-300">
                {spark || "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}
      <p className="mt-4 max-w-3xl text-xs text-gray-500">{data.definition}</p>
    </section>
  );
}
