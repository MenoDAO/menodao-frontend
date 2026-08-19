"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, MemberAppointment } from "@/lib/api";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";

const OPEN = new Set(["BOOKED", "RESCHEDULED"]);

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => api.listAppointments(),
  });
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const cancel = useMutation({
    mutationFn: () => api.cancelAppointment(cancelId!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setCancelId(null);
      setReason("");
    },
  });

  const upcoming = useMemo(
    () => (data || []).filter((a) => OPEN.has(a.status) && new Date(a.scheduledAt) > new Date()),
    [data],
  );
  const past = useMemo(
    () => (data || []).filter((a) => !upcoming.includes(a)),
    [data, upcoming],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Book a nearby clinic, share intake, and we will remind you the day before and one hour before.
          </p>
        </div>
        <Link
          href="/dashboard/camps"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Find a clinic
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-500">
          {(error as Error).message || "Could not load appointments."}
        </p>
      )}

      <Section title="Upcoming" items={upcoming} onCancel={setCancelId} />
      <Section title="Past" items={past} />

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-800"
            onSubmit={(e) => {
              e.preventDefault();
              cancel.mutate();
            }}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Cancel appointment</h3>
            <p className="mt-1 text-sm text-gray-500">
              The clinic will be notified by SMS and email.
            </p>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="mt-3 w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCancelId(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm"
              >
                Keep it
              </button>
              <button
                type="submit"
                disabled={cancel.isPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm text-white"
              >
                {cancel.isPending ? "Cancelling…" : "Cancel appointment"}
              </button>
            </div>
            {cancel.isError && (
              <p className="mt-2 text-sm text-red-500">{(cancel.error as Error).message}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  onCancel,
}: {
  title: string;
  items: MemberAppointment[];
  onCancel?: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700">
          None
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{a.clinic.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" /> {a.clinic.physicalLocation}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(a.scheduledAt).toLocaleString("en-KE")}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" /> {a.intakeReason}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {a.status.replace(/_/g, " ")}
                  </span>
                  {onCancel && OPEN.has(a.status) && (
                    <div className="mt-2 flex flex-col gap-1">
                      <Link
                        href={`/dashboard/appointments/book?clinicId=${a.clinic.id}&reschedule=${a.id}`}
                        className="text-sm text-emerald-600"
                      >
                        Reschedule
                      </Link>
                      <button
                        onClick={() => onCancel(a.id)}
                        className="text-sm text-red-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
