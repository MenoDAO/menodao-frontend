"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { NorthStar } from "./components/care-intelligence/NorthStar";
import { CareLoop } from "./components/care-intelligence/CareLoop";
import { CareLoopHealth } from "./components/care-intelligence/CareLoopHealth";
import {
  ActionCenter,
  DataHealth,
  ExperimentsPanel,
  GeographyAndAcquisition,
  MembershipIntelligence,
  MembershipPanels,
  ObservedFacts,
  OperationsPanel,
  PatientImpact,
  SecondaryMetrics,
  Sustainability,
  TargetsPanel,
  AppointmentsPanel,
  TimeToCare,
} from "./components/care-intelligence/Panels";
import { daysAgoIso, startOfMonthIso } from "./components/care-intelligence/format";
import { Loader2 } from "lucide-react";

const PRESETS = [
  { id: "month", label: "This month" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "180", label: "6 months" },
  { id: "365", label: "12 months" },
] as const;

export default function CareIntelligencePage() {
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["id"]>("month");
  const [county, setCounty] = useState("");

  const range = useMemo(() => {
    const to = new Date().toISOString();
    if (preset === "month") return { from: startOfMonthIso(), to };
    const days = Number(preset);
    return { from: daysAgoIso(days), to };
  }, [preset]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "care-intelligence", range.from, range.to, county],
    queryFn: () =>
      adminApi.getCareIntelligence({
        from: range.from,
        to: range.to,
        county: county || undefined,
      }),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            MenoDAO
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">Care Intelligence</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            What matters for care delivery, where the loop is breaking, what changed, and
            what to investigate next.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-1">
            {PRESETS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPreset(opt.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  preset === opt.id
                    ? "bg-emerald-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="Filter county"
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          />
          <Link
            href="/admin/data-room"
            className="rounded-lg border border-emerald-500/40 px-3 py-2 text-center text-sm text-emerald-300 hover:bg-emerald-500/10"
          >
            Impact data room
          </Link>
        </div>
      </header>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {(error as Error).message}
        </p>
      )}

      {data && (
        <>
          <NorthStar data={data.northStar} />
          <SecondaryMetrics data={data.secondary} />
          <CareLoop data={data} />
          <CareLoopHealth rows={data.careLoopHealth} />
          <PatientImpact data={data} />
          <MembershipPanels data={data} />
          <MembershipIntelligence data={data.membership} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TimeToCare data={data.timeToCare} />
            <OperationsPanel data={data.operations} />
          </div>
          <AppointmentsPanel data={data.appointments} />
          <GeographyAndAcquisition data={data} />
          <ActionCenter items={data.actionCenter} />
          <ObservedFacts facts={data.observedFacts} />
          <Sustainability data={data.sustainability} />
          <DataHealth data={data.dataHealth} />
          <TargetsPanel />
          <ExperimentsPanel />
        </>
      )}
    </div>
  );
}
