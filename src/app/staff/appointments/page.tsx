"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { staffApi, StaffAppointment } from "@/lib/staff-api";
import { Loader2 } from "lucide-react";

function todayEat() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(
    new Date(),
  );
}

export default function StaffAppointmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayEat());
  const [action, setAction] = useState<{
    id: string;
    type: "cancel" | "no-show" | "note" | "reschedule";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [newTimeLocal, setNewTimeLocal] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff-appointments", date],
    queryFn: () => staffApi.listAppointments(date),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["staff-appointments", date] });

  const cancel = useMutation({
    mutationFn: () => staffApi.cancelAppointment(action!.id, reason),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });
  const noShow = useMutation({
    mutationFn: () => staffApi.markNoShow(action!.id, reason),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });
  const note = useMutation({
    mutationFn: () => staffApi.addAppointmentNote(action!.id, reason),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });
  const reschedule = useMutation({
    mutationFn: () =>
      staffApi.rescheduleAppointment(
        action!.id,
        new Date(`${newTimeLocal}:00+03:00`).toISOString(),
        reason,
      ),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const checkIn = async (row: StaffAppointment) => {
    try {
      await staffApi.checkIn({
        phoneNumber: row.member.phoneNumber,
        chiefComplaint: row.intakeReason,
        medicalHistory: [row.allergies, row.currentMedications, row.medicalConditions]
          .filter(Boolean)
          .join("; "),
        hasConsent: row.hasConsent,
        appointmentId: row.id,
      });
      invalidate();
      router.push("/staff");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Check-in failed");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!action) return;
    if (action.type === "cancel") cancel.mutate();
    if (action.type === "no-show") noShow.mutate();
    if (action.type === "note") note.mutate();
    if (action.type === "reschedule") reschedule.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-gray-500">
            Today&apos;s booked patients. Check-in links the visit. Cancel, reschedule, or mark no-show with a reason — the member is notified.
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {isLoading && <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />}
      {error && <p className="text-red-500">{(error as Error).message}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-3">Time</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row) => (
              <tr key={row.id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="p-3 whitespace-nowrap">
                  {new Date(row.scheduledAt).toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-3">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {row.member.fullName || "Member"}
                  </p>
                  <p className="text-xs text-gray-500">{row.member.phoneNumber}</p>
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {row.intakeReason}
                  {row.painLevel != null && (
                    <span className="ml-1 text-xs text-gray-400">pain {row.painLevel}/10</span>
                  )}
                </td>
                <td className="p-3">{row.status.replace(/_/g, " ")}</td>
                <td className="p-3">
                  {["BOOKED", "RESCHEDULED"].includes(row.status) && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => checkIn(row)}
                        className="text-emerald-600 hover:underline"
                      >
                        Check in
                      </button>
                      <button
                        onClick={() => {
                          setReason("");
                          setNewTimeLocal("");
                          setAction({ id: row.id, type: "reschedule" });
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setReason("");
                          setAction({ id: row.id, type: "cancel" });
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setReason("");
                          setAction({ id: row.id, type: "no-show" });
                        }}
                        className="text-amber-600 hover:underline"
                      >
                        No-show
                      </button>
                      <button
                        onClick={() => {
                          setReason("");
                          setAction({ id: row.id, type: "note" });
                        }}
                        className="text-gray-600 hover:underline"
                      >
                        Note
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td className="p-6 text-gray-500" colSpan={5}>
                  No appointments this day.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-800"
          >
            <h3 className="font-semibold capitalize text-gray-900 dark:text-white">
              {action.type.replace("-", " ")}
            </h3>
            {action.type === "reschedule" && (
              <input
                required
                type="datetime-local"
                value={newTimeLocal}
                onChange={(e) => setNewTimeLocal(e.target.value)}
                className="mt-3 w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            )}
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (shared with the member where relevant)"
              className="mt-3 w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAction(null)}
                className="flex-1 rounded-lg border py-2 text-sm"
              >
                Back
              </button>
              <button type="submit" className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white">
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
