"use client";

import Link from "next/link";
import { CareIntelligenceDashboard, MetricValue } from "@/lib/care-intelligence";
import {
  emptyLabel,
  formatDays,
  formatKes,
  formatMinutes,
  formatNumber,
  formatPct,
  formatPctChange,
} from "./format";
import { ChangeEvent, FormEvent, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function MetricCell({
  item,
  emphasize,
}: {
  item: MetricValue;
  emphasize?: boolean;
}) {
  const empty = emptyLabel(item.dataStatus);
  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-800 p-4 ${emphasize ? "sm:col-span-2" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
      {empty ? (
        <p className="mt-2 text-sm text-gray-400">{empty}</p>
      ) : (
        <p className="mt-1 text-2xl font-semibold text-white">
          {/rate|retention/i.test(item.label)
            ? formatPct(item.value)
            : formatNumber(item.value)}
        </p>
      )}
      {item.changePct != null && (
        <p className="mt-1 text-xs text-gray-500">{formatPctChange(item.changePct)} vs prior</p>
      )}
      {(item.definition || item.cohortDefinition) && (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          {item.cohortDefinition || item.definition}
        </p>
      )}
    </div>
  );
}

export function SecondaryMetrics({
  data,
}: {
  data: CareIntelligenceDashboard["secondary"];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">Core care metrics</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCell item={data.patientsTreated} />
        <MetricCell item={data.activeMembers} />
        <MetricCell item={data.paidMembers} />
        <MetricCell item={data.treatmentCompletionRate} />
        <MetricCell item={data.patientRetention} />
        <MetricCell item={data.referralRate} />
      </div>
    </section>
  );
}

export function MembershipPanels({ data }: { data: CareIntelligenceDashboard }) {
  const f = data.membershipFunnel;
  const c = data.membershipConversion;
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-lg font-semibold text-white">Membership funnel</h2>
        <p className="mt-1 text-sm text-gray-400">Stock as of period end — ratios stay visible.</p>
        <ol className="mt-4 space-y-3">
          <FunnelRow label="Registered" value={f.registered} />
          <FunnelRow
            label="Paid"
            value={f.paid}
            conversion={f.paidConversion}
            warn={f.paidConversion != null && f.paidConversion < 0.15}
          />
          <FunnelRow
            label="Booked"
            value={f.booked}
            missing={!f.bookedTracked}
            missingLabel="Appointment booking not tracked yet"
          />
          <FunnelRow label="Treated" value={f.treated} conversion={f.paidToTreated} />
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-lg font-semibold text-white">Membership conversion</h2>
        <p className="mt-4 text-4xl font-semibold text-white">
          {c.paid} / {c.registered}
        </p>
        <p className="mt-1 text-xl text-emerald-300">{formatPct(c.rate)}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Target</dt>
            <dd className="text-white">{formatPct(c.target)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Gap</dt>
            <dd className={c.gapPp != null && c.gapPp < 0 ? "text-red-400" : "text-white"}>
              {c.gapPp == null ? "—" : `${c.gapPp.toFixed(1)} pp`}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-gray-500">
          Membership is treated as a care-funding mechanism: {data.membershipToCare.definition}
        </p>
        <p className="mt-2 text-sm text-gray-300">
          Paid members using care this period: {formatPct(data.membershipToCare.usedCarePct)}
        </p>
      </div>
    </section>
  );
}

function FunnelRow({
  label,
  value,
  conversion,
  warn,
  missing,
  missingLabel,
}: {
  label: string;
  value: number | null;
  conversion?: number | null;
  warn?: boolean;
  missing?: boolean;
  missingLabel?: string;
}) {
  return (
    <li>
      {conversion != null && (
        <p className={`mb-1 text-xs ${warn ? "font-semibold text-red-400" : "text-gray-500"}`}>
          ↓ {formatPct(conversion)}
        </p>
      )}
      <div className="flex items-baseline justify-between">
        <span className="text-gray-400">{label}</span>
        {missing ? (
          <span className="text-xs text-gray-500">{missingLabel}</span>
        ) : (
          <span className="text-xl font-semibold text-white">{formatNumber(value)}</span>
        )}
      </div>
    </li>
  );
}

export function TimeToCare({ data }: { data: CareIntelligenceDashboard["timeToCare"] }) {
  const t = data.registrationToFirstVisit;
  const booking = data.bookingToAppointment;
  const checkIn = data.appointmentToTreatment;
  const empty = emptyLabel(t.dataStatus);
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Time to first care</h2>
      {empty ? (
        <p className="mt-3 text-sm text-gray-400">
          {empty}. Need at least {t.sampleSize === 0 ? "5" : "more"} first-visit observations for a
          meaningful median.
        </p>
      ) : (
        <>
          <p className="mt-3 text-4xl font-semibold text-white">{formatDays(t.medianDays)}</p>
          <p className="mt-1 text-sm text-gray-400">
            Median · {formatPctChange(t.changePct)} vs last period · n={t.sampleSize}
          </p>
        </>
      )}
      <p className="mt-3 text-xs text-gray-500">{t.definition}</p>
      <ul className="mt-4 space-y-1 text-xs text-gray-500">
        <li>
          Booking → appointment:{" "}
          {emptyLabel(booking.dataStatus) ||
            `${formatDays(booking.medianDays)} (n=${booking.sampleSize})`}
        </li>
        <li>
          Appointment → check-in:{" "}
          {emptyLabel(checkIn.dataStatus) ||
            `${formatMinutes(checkIn.medianMinutes)} (n=${checkIn.sampleSize})`}
        </li>
      </ul>
    </section>
  );
}

export function AppointmentsPanel({
  data,
}: {
  data: CareIntelligenceDashboard["appointments"];
}) {
  if (!data) return null;
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Appointments</h2>
      <p className="mt-1 text-sm text-gray-400">{data.definition}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ImpactStat label="Created" value={formatNumber(data.created)} />
        <ImpactStat label="Members booked" value={formatNumber(data.bookedMembers)} />
        <ImpactStat label="Attended" value={formatNumber(data.attended)} />
        <ImpactStat label="No-shows" value={formatNumber(data.noShow)} />
        <ImpactStat label="Cancelled" value={formatNumber(data.cancelled)} />
        <ImpactStat label="Rescheduled" value={formatNumber(data.rescheduled)} />
        <ImpactStat label="Kept rate" value={formatPct(data.keptRate)} />
        <ImpactStat label="No-show rate" value={formatPct(data.noShowRate)} />
      </div>
    </section>
  );
}

export function PatientImpact({ data }: { data: CareIntelligenceDashboard }) {
  const p = data.patientImpact;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Patient impact</h2>
        <p className="text-sm text-gray-400">
          This is a healthcare impact view, not a financial SaaS dashboard.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ImpactStat label="Unique patients treated" value={formatNumber(p.uniquePatientsTreated)} />
        <ImpactStat label="Completed treatments" value={formatNumber(p.completedTreatments)} />
        <ImpactStat label="First-time patients" value={formatNumber(p.firstTimePatients)} />
        <ImpactStat label="Returning patients" value={formatNumber(p.returningPatients)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h3 className="font-medium text-white">Treatment mix</h3>
          {data.treatmentMix.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">Not enough data yet</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">This period</th>
                  <th className="pb-2 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.treatmentMix.map((row) => (
                  <tr key={row.category} className="border-t border-gray-700">
                    <td className="py-2 capitalize text-gray-200">{row.category}</td>
                    <td className="py-2 text-white">{row.current}</td>
                    <td className="py-2 text-gray-400">{formatPctChange(row.changePct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h3 className="font-medium text-white">Satisfaction</h3>
          {emptyLabel(p.patientSatisfaction.dataStatus) ? (
            <p className="mt-3 text-sm text-gray-400">
              {emptyLabel(p.patientSatisfaction.dataStatus)}
            </p>
          ) : (
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatPct(p.patientSatisfaction.highSatisfactionRate)}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">{p.patientSatisfaction.definition}</p>
        </div>
      </div>
    </section>
  );
}

function ImpactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function GeographyAndAcquisition({ data }: { data: CareIntelligenceDashboard }) {
  const areas = data.geography.areas || [];
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-lg font-semibold text-white">Geographic intelligence</h2>
        <p className="mt-1 text-sm text-gray-400">
          Where demand and completed care actually come from — not just headcount.
        </p>
        {areas.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Not enough geography captured yet</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Area</th>
                  <th className="pb-2">Members</th>
                  <th className="pb-2">Paid</th>
                  <th className="pb-2">Treated</th>
                  <th className="pb-2">Completed share</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((row) => (
                  <tr key={row.area} className="border-t border-gray-700">
                    <td className="py-2 text-white">{row.area}</td>
                    <td className="py-2 text-gray-300">{row.members}</td>
                    <td className="py-2 text-gray-300">
                      {row.paid} ({formatPct(row.paidConversion)})
                    </td>
                    <td className="py-2 text-gray-300">{row.patientsTreated}</td>
                    <td className="py-2 text-gray-300">{formatPct(row.completedShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-lg font-semibold text-white">Acquisition</h2>
        <p className="mt-1 text-sm text-gray-400">
          Sort channels by treatment yield, not registration volume.
        </p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">Channel</th>
              <th className="pb-2">Registered</th>
              <th className="pb-2">Paid</th>
              <th className="pb-2">Treated</th>
              <th className="pb-2">Yield</th>
            </tr>
          </thead>
          <tbody>
            {data.acquisition.map((row) => (
              <tr key={row.channel} className="border-t border-gray-700">
                <td className="py-2 capitalize text-white">{row.channel}</td>
                <td className="py-2 text-gray-300">{row.registered}</td>
                <td className="py-2 text-gray-300">{row.paid}</td>
                <td className="py-2 text-gray-300">{row.treated}</td>
                <td className="py-2 text-gray-300">{formatPct(row.treatmentYield)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">
          Unknown acquisition source is a data-quality issue, not a marketing channel.
        </p>
      </div>
    </section>
  );
}

export function Sustainability({ data }: { data: CareIntelligenceDashboard["sustainability"] }) {
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Unit impact economics</h2>
      <p className="mt-1 text-sm text-gray-400">{data.note}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-gray-500">Membership contributions</dt>
          <dd className="text-lg text-white">{formatKes(data.membershipContributionsKes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Care disbursed</dt>
          <dd className="text-lg text-white">{formatKes(data.careDisbursedKes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Funding per completed treatment</dt>
          <dd className="text-lg text-white">{formatKes(data.fundingPerCompletedTreatment)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">MenoDAO-supported portion / treatment</dt>
          <dd className="text-lg text-white">{formatKes(data.subsidyPerTreatment)}</dd>
        </div>
      </dl>
      {data.unitImpact && (
        <p className="mt-4 text-sm text-emerald-300">
          KSh 1,000 of sustainable funding currently corresponds to{" "}
          {data.unitImpact.treatmentsPer1000Kes.toFixed(2)} completed treatments in this period.
        </p>
      )}
    </section>
  );
}

export function DataHealth({ data }: { data: CareIntelligenceDashboard["dataHealth"] }) {
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Data health</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HealthPct label="Geography captured" value={data.geographyCaptured} />
        <HealthPct label="Acquisition source" value={data.acquisitionSourceCaptured} />
        <HealthPct label="Treatment outcomes" value={data.treatmentOutcomesCaptured} />
        <HealthPct label="Patient records (geo)" value={data.patientRecordsComplete} />
      </div>
      {data.issues.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-300">
          {data.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HealthPct({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg text-white">{value == null ? "—" : formatPct(value, 0)}</p>
    </div>
  );
}

export function ActionCenter({ items }: { items: CareIntelligenceDashboard["actionCenter"] }) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-lg font-semibold text-white">Action center</h2>
        <p className="mt-2 text-sm text-gray-400">
          No evidence-backed opportunities with enough data right now.
        </p>
      </section>
    );
  }
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Today&apos;s growth opportunities</h2>
      {items.map((item) => (
        <article key={item.cohortKey + item.problem} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-xs uppercase tracking-wide text-amber-400">{item.status}</p>
          <h3 className="mt-1 font-medium text-white">{item.problem}</h3>
          <p className="mt-2 text-sm text-gray-300">{item.evidence}</p>
          <p className="mt-2 text-sm text-gray-400">
            Suggested action: {item.suggestedAction}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Metric: {item.metricId} · Confidence: {item.confidence} · Expected: {item.expectedImpact}
          </p>
          <Link
            href={`/admin/care-intelligence/cohorts/${item.cohortKey}`}
            className="mt-3 inline-flex text-sm text-emerald-400 hover:underline"
          >
            View cohort
          </Link>
        </article>
      ))}
    </section>
  );
}

export function ObservedFacts({ facts }: { facts: CareIntelligenceDashboard["observedFacts"] }) {
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Observed facts</h2>
      <p className="mt-1 text-sm text-gray-400">
        Directly supported by dashboard data. Inference is not mixed in.
      </p>
      <ul className="mt-4 space-y-3">
        {facts.map((fact) => (
          <li key={fact.metricId + fact.text} className="border-l-2 border-emerald-500 pl-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
              Observed · {fact.metricId}
            </p>
            <p className="text-sm text-gray-200">{fact.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExperimentsPanel() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "care-experiments"],
    queryFn: () => adminApi.getCareExperiments(),
  });
  const [form, setForm] = useState({
    name: "",
    hypothesis: "",
    metricId: "registration_to_paid",
    baseline: "",
    target: "",
    startDate: new Date().toISOString().slice(0, 10),
    owner: "",
  });

  const create = useMutation({
    mutationFn: () =>
      adminApi.createCareExperiment({
        name: form.name,
        hypothesis: form.hypothesis,
        metricId: form.metricId,
        baseline: form.baseline ? Number(form.baseline) : undefined,
        target: form.target ? Number(form.target) : undefined,
        startDate: form.startDate,
        owner: form.owner || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "care-experiments"] });
      setForm((f) => ({ ...f, name: "", hypothesis: "" }));
    },
  });

  const onChange =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Experiments</h2>
      <p className="mt-1 text-sm text-gray-400">
        Track hypotheses against a baseline metric. Recommendations never run themselves.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Experiment name"
          value={form.name}
          onChange={onChange("name")}
          className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <select
          value={form.metricId}
          onChange={onChange("metricId")}
          className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        >
          <option value="registration_to_paid">Paid conversion</option>
          <option value="completed_treatments">Completed treatments</option>
          <option value="treatment_completion">Treatment completion</option>
          <option value="retention_90d">90-day retention</option>
        </select>
        <textarea
          required
          placeholder="Hypothesis"
          value={form.hypothesis}
          onChange={onChange("hypothesis")}
          className="sm:col-span-2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Baseline (e.g. 0.075)"
          value={form.baseline}
          onChange={onChange("baseline")}
          className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Target (e.g. 0.12)"
          value={form.target}
          onChange={onChange("target")}
          className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <input
          type="date"
          value={form.startDate}
          onChange={onChange("startDate")}
          className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Owner"
          value={form.owner}
          onChange={onChange("owner")}
          className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="sm:col-span-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {create.isPending ? "Saving…" : "Create experiment"}
        </button>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">Experiment</th>
              <th className="pb-2">Metric</th>
              <th className="pb-2">Baseline → target</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row) => (
              <tr key={row.id} className="border-t border-gray-700">
                <td className="py-2 text-white">{row.name}</td>
                <td className="py-2 text-gray-400">{row.metricId}</td>
                <td className="py-2 text-gray-400">
                  {row.baseline ?? "—"} → {row.target ?? "—"}
                </td>
                <td className="py-2 text-gray-300">{row.status}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr>
                <td className="py-3 text-gray-500" colSpan={4}>
                  No experiments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MembershipIntelligence({ data }: { data: CareIntelligenceDashboard["membership"] }) {
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Membership intelligence</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ImpactStat label="Registered" value={formatNumber(data.registered)} />
        <ImpactStat label="Paid / active" value={formatNumber(data.paid)} />
        <ImpactStat label="Pending payment" value={formatNumber(data.pendingPayment)} />
        <ImpactStat label="Failed payments" value={formatNumber(data.failedPayments)} />
        <ImpactStat label="Expired" value={formatNumber(data.expired)} />
        <ImpactStat label="New subscriptions" value={formatNumber(data.newSubscriptions)} />
        <ImpactStat label="New registrations" value={formatNumber(data.newRegistrations)} />
        <ImpactStat
          label="Avg membership duration"
          value={data.avgMembershipDays == null ? "—" : formatDays(data.avgMembershipDays)}
        />
      </div>
    </section>
  );
}

export function TargetsPanel() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "care-targets"],
    queryFn: () => adminApi.getCareTargets(),
  });
  const update = useMutation({
    mutationFn: (row: { metricId: string; targetValue: number }) =>
      adminApi.updateCareTarget(row.metricId, { targetValue: row.targetValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "care-targets"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "care-intelligence"] });
    },
  });

  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Target thresholds</h2>
      <p className="mt-1 text-sm text-gray-400">
        Care-loop health and bottleneck ranking use these values. Change them; do not invent scores.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">Metric</th>
              <th className="pb-2">Target</th>
              <th className="pb-2">Min sample</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row) => (
              <tr key={row.metricId} className="border-t border-gray-700">
                <td className="py-2 text-white">{row.metricId.replace(/_/g, " ")}</td>
                <td className="py-2">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={row.targetValue}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next) || next === row.targetValue) return;
                      update.mutate({ metricId: row.metricId, targetValue: next });
                    }}
                    className="w-28 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 text-gray-400">{row.minSampleSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OperationsPanel({ data }: { data: CareIntelligenceDashboard["operations"] }) {
  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Operations</h2>
      <p className="mt-1 text-sm text-gray-400">{data.capacityNote}</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ImpactStat label="Check-ins" value={formatNumber(data.attendance)} />
        <ImpactStat
          label="Providers active"
          value={formatNumber(data.providerUtilization.providers)}
        />
        <ImpactStat
          label="Visits / provider"
          value={
            data.providerUtilization.visitsPerProvider == null
              ? "—"
              : data.providerUtilization.visitsPerProvider.toFixed(1)
          }
        />
      </div>
    </section>
  );
}
