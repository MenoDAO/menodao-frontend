"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import {
  formatKes,
  formatNumber,
  formatPct,
} from "../components/care-intelligence/format";
import { Loader2 } from "lucide-react";

export default function DataRoomPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "care-data-room"],
    queryFn: () => adminApi.getCareDataRoom(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-red-400">{(error as Error)?.message || "Unable to load data room"}</p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
          Impact & scale
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">MenoDAO data room</h1>
        <p className="mt-3 max-w-2xl text-gray-300">{data.framing}</p>
        <p className="mt-2 text-xs text-gray-500">
          Aggregated metrics only. Individual health records are not included in this view.
        </p>
      </header>

      <Section title="Care" body="Completed treatment is the core outcome.">
        <Stat label="Completed treatments" value={formatNumber(data.care.completedTreatments)} />
        <Stat label="Patients treated" value={formatNumber(data.care.patientsTreated)} />
        <Stat
          label="Treatment completion"
          value={formatPct(data.care.treatmentCompletionRate)}
        />
      </Section>

      <Section title="Access" body="People entering the care system.">
        <Stat label="Registered members" value={formatNumber(data.access.registered)} />
        <Stat label="Paid members" value={formatNumber(data.access.paid)} />
        <Stat label="Paid conversion" value={formatPct(data.access.paidConversion)} />
      </Section>

      <Section
        title="Appointments"
        body={
          data.appointments?.definition ||
          "Booked clinic visits, kept vs no-show, and cancellations in the period."
        }
      >
        <Stat label="Appointments created" value={formatNumber(data.appointments?.created ?? null)} />
        <Stat label="Members who booked" value={formatNumber(data.appointments?.bookedMembers ?? null)} />
        <Stat label="Attended" value={formatNumber(data.appointments?.attended ?? null)} />
        <Stat label="No-shows" value={formatNumber(data.appointments?.noShow ?? null)} />
        <Stat label="Cancelled" value={formatNumber(data.appointments?.cancelled ?? null)} />
        <Stat label="Kept rate" value={formatPct(data.appointments?.keptRate ?? null)} />
      </Section>

      <Section title="Reach" body={data.reach.note}>
        <Stat
          label="Website sessions (proxy)"
          value={formatNumber(data.reach.websiteSessions ?? null)}
        />
      </Section>

      <Section
        title="Sustainability"
        body="How efficiently additional funding translates into care — not a profit dashboard."
      >
        <Stat
          label="Membership contributions"
          value={formatKes(data.sustainability.membershipContributionsKes)}
        />
        <Stat
          label="Care disbursed"
          value={formatKes(data.sustainability.careDisbursedKes)}
        />
        <Stat
          label="Funding / completed treatment"
          value={formatKes(data.sustainability.fundingPerCompletedTreatment)}
        />
        <Stat
          label="Supported portion / treatment"
          value={formatKes(data.sustainability.subsidyPerTreatment)}
        />
      </Section>

      <section>
        <h2 className="text-xl font-semibold text-white">Communities</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">Area</th>
              <th className="pb-2">Demand share</th>
              <th className="pb-2">Completed share</th>
            </tr>
          </thead>
          <tbody>
            {(data.geography?.areas || []).map((row) => (
              <tr key={row.area} className="border-t border-gray-700">
                <td className="py-2 text-white">{row.area}</td>
                <td className="py-2 text-gray-300">{formatPct(row.demandShare)}</td>
                <td className="py-2 text-gray-300">{formatPct(row.completedShare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Section({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-400">{body}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
