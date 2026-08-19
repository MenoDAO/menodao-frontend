"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

function todayEat() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(
    new Date(),
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <BookAppointmentForm />
    </Suspense>
  );
}

function BookAppointmentForm() {
  const router = useRouter();
  const params = useSearchParams();
  const clinicId = params.get("clinicId") || "";
  const rescheduleId = params.get("reschedule");

  const today = useMemo(() => todayEat(), []);

  const [date, setDate] = useState(today);
  const [scheduledAt, setScheduledAt] = useState("");
  const [intakeReason, setIntakeReason] = useState("");
  const [painLevel, setPainLevel] = useState("0");
  const [allergies, setAllergies] = useState("");
  const [meds, setMeds] = useState("");
  const [conditions, setConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");

  const { data: clinic, isLoading: clinicLoading } = useQuery({
    queryKey: ["public-clinic", clinicId],
    queryFn: () => api.getPublicClinic(clinicId),
    enabled: Boolean(clinicId),
  });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["appointment-slots", clinicId, date],
    queryFn: () => api.getAppointmentSlots(clinicId, date),
    enabled: Boolean(clinicId && date),
  });

  const book = useMutation({
    mutationFn: () =>
      rescheduleId
        ? api.rescheduleAppointment(rescheduleId, scheduledAt, rescheduleReason)
        : api.bookAppointment({
            clinicId,
            scheduledAt,
            intakeReason,
            painLevel: Number(painLevel),
            allergies: allergies || undefined,
            currentMedications: meds || undefined,
            medicalConditions: conditions || undefined,
            memberNotes: notes || undefined,
            hasConsent: consent,
          }),
    onSuccess: () => router.push("/dashboard/appointments"),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    book.mutate();
  };

  if (!clinicId) {
    return (
      <p className="text-sm text-gray-500">
        Choose a clinic first from{" "}
        <Link href="/dashboard/camps" className="text-emerald-600 underline">
          Find a Clinic
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {rescheduleId ? "Reschedule appointment" : "Book an appointment"}
        </h1>
        {clinicLoading ? (
          <Loader2 className="mt-3 h-5 w-5 animate-spin text-emerald-600" />
        ) : (
          <p className="mt-1 text-sm text-gray-500">
            {clinic?.name} · {clinic?.leadDentistName} · {clinic?.physicalLocation}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-300">Date</span>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setScheduledAt("");
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Time (Africa/Nairobi)</p>
          {slotsLoading ? (
            <Loader2 className="mt-2 h-5 w-5 animate-spin text-emerald-600" />
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(slots?.slots || []).map((slot) => (
                <button
                  type="button"
                  key={slot.scheduledAt}
                  disabled={!slot.available}
                  onClick={() => setScheduledAt(slot.scheduledAt)}
                  className={`rounded-lg border px-2 py-2 text-xs ${
                    scheduledAt === slot.scheduledAt
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : slot.available
                        ? "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200"
                        : "cursor-not-allowed border-gray-200 text-gray-400 line-through"
                  }`}
                >
                  {new Date(slot.scheduledAt).toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Africa/Nairobi",
                  })}
                </button>
              ))}
              {slots && slots.slots.length === 0 && (
                <p className="col-span-3 text-sm text-gray-500">Clinic closed this day.</p>
              )}
            </div>
          )}
        </div>

        {rescheduleId ? (
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Why are you rescheduling?</span>
            <textarea
              required
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </label>
        ) : (
          <>
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300">What is the main dental problem?</span>
              <textarea
                required
                value={intakeReason}
                onChange={(e) => setIntakeReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300">Pain 0–10</span>
              <input
                type="number"
                min={0}
                max={10}
                value={painLevel}
                onChange={(e) => setPainLevel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300">Allergies</span>
              <input
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300">Current medications</span>
              <input
                value={meds}
                onChange={(e) => setMeds(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300">Medical conditions</span>
              <input
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300">Anything else the dentist should know?</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              I consent to MenoDAO sharing this intake with the appointed clinic so they can prepare for my visit.
            </label>
          </>
        )}

        {book.isError && (
          <p className="text-sm text-red-500">{(book.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={
            book.isPending ||
            !scheduledAt ||
            (!rescheduleId && (!consent || !intakeReason))
          }
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {book.isPending
            ? "Saving…"
            : rescheduleId
              ? "Confirm new time"
              : "Confirm appointment"}
        </button>
        <p className="text-xs text-gray-500">
          You will get one SMS the day before and one SMS an hour before. The clinic is notified by SMS and email.
        </p>
      </form>
    </div>
  );
}
