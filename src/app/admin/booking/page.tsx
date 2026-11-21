"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock3,
  Link2,
  Loader2,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  Unlink,
} from "lucide-react";
import {
  adminApi,
  type AdminDoctor,
  type AdminBookingProcedure,
  type ClinicOperatingHour,
  type DoctorAvailability,
} from "@/lib/admin-api";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type AvailabilityRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type HoursRow = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

function availabilityRows(rows: DoctorAvailability[]): AvailabilityRow[] {
  return DAY_NAMES.map((_, dayOfWeek) => {
    const found = rows.find((row) => row.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      startTime: found?.startTime ?? "08:00",
      endTime: found?.endTime ?? "17:00",
      isActive: found?.isActive ?? false,
    };
  });
}

function hoursRows(rows: ClinicOperatingHour[]): HoursRow[] {
  return DAY_NAMES.map((_, dayOfWeek) => {
    const found = rows.find((row) => row.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      openTime: found?.openTime ?? "08:00",
      closeTime: found?.closeTime ?? "17:00",
      isClosed: found?.isClosed ?? dayOfWeek === 0,
    };
  });
}

export default function AdminBookingPage() {
  const queryClient = useQueryClient();
  const [clinicId, setClinicId] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [newDoctor, setNewDoctor] = useState({
    name: "",
    title: "Dr.",
    specialty: "",
    consultationMinutes: "15",
    bufferMinutes: "5",
  });
  const [availabilityDoctor, setAvailabilityDoctor] =
    useState<AdminDoctor | null>(null);
  const [availabilityDraft, setAvailabilityDraft] = useState<
    AvailabilityRow[]
  >([]);
  const [hoursOverrides, setHoursOverrides] = useState<
    Record<number, Partial<HoursRow>>
  >({});
  const [durationOverrides, setDurationOverrides] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showError = (error: unknown, fallback: string) =>
    setToast({
      type: "error",
      message: error instanceof Error ? error.message : fallback,
    });

  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ["admin", "clinics", "all"],
    queryFn: () => adminApi.listClinics(),
  });

  const activeClinicId = clinicId || clinics?.[0]?.id || "";

  const {
    data: doctorsData,
    isLoading: doctorsLoading,
    refetch: refetchDoctors,
  } = useQuery({
    queryKey: ["admin", "booking", "doctors", activeClinicId],
    queryFn: () => adminApi.listDoctors(activeClinicId),
    enabled: Boolean(activeClinicId),
  });

  const { data: hoursData, isLoading: hoursLoading } = useQuery({
    queryKey: ["admin", "booking", "hours", activeClinicId],
    queryFn: () => adminApi.listClinicHours(activeClinicId),
    enabled: Boolean(activeClinicId),
  });

  const { data: proceduresData, isLoading: proceduresLoading } = useQuery({
    queryKey: ["admin", "booking", "procedures"],
    queryFn: () => adminApi.listBookingProcedures(),
  });

  const { data: providersData } = useQuery({
    queryKey: ["admin", "calendar", "providers"],
    queryFn: () => adminApi.getCalendarProviders(),
  });

  const doctors = doctorsData?.doctors ?? [];
  const procedures = proceduresData?.procedures ?? [];
  const hoursDraft = hoursRows(hoursData?.hours ?? []).map((row) => ({
    ...row,
    ...hoursOverrides[row.dayOfWeek],
  }));
  const setHoursRow = (dayOfWeek: number, patch: Partial<HoursRow>) =>
    setHoursOverrides((previous) => ({
      ...previous,
      [dayOfWeek]: { ...previous[dayOfWeek], ...patch },
    }));
  const durationValue = (procedure: AdminBookingProcedure) =>
    durationOverrides[procedure.id] ?? String(procedure.durationMinutes);

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "booking"] });

  const createDoctorMutation = useMutation({
    mutationFn: () =>
      adminApi.createDoctor(activeClinicId, {
        name: newDoctor.name.trim(),
        title: newDoctor.title.trim() || null,
        specialty: newDoctor.specialty.trim() || null,
        consultationMinutes: Number(newDoctor.consultationMinutes),
        bufferMinutes: Number(newDoctor.bufferMinutes),
      }),
    onSuccess: () => {
      setNewDoctor({
        name: "",
        title: "Dr.",
        specialty: "",
        consultationMinutes: "15",
        bufferMinutes: "5",
      });
      void invalidateAll();
      setToast({ type: "success", message: "Doctor added." });
    },
    onError: (error) => showError(error, "Failed to add doctor"),
  });

  const toggleDoctorMutation = useMutation({
    mutationFn: (doctor: AdminDoctor) =>
      adminApi.updateDoctor(doctor.id, { isActive: !doctor.isActive }),
    onSuccess: () => void invalidateAll(),
    onError: (error) => showError(error, "Failed to update doctor"),
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDoctor(id),
    onSuccess: () => void invalidateAll(),
    onError: (error) => showError(error, "Failed to delete doctor"),
  });

  const availabilityMutation = useMutation({
    mutationFn: () =>
      adminApi.setDoctorAvailability(
        availabilityDoctor!.id,
        availabilityDraft.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          isActive: row.isActive,
        })),
      ),
    onSuccess: () => {
      void invalidateAll();
      setAvailabilityDoctor(null);
      setToast({ type: "success", message: "Availability saved." });
    },
    onError: (error) => showError(error, "Failed to save availability"),
  });

  const hoursMutation = useMutation({
    mutationFn: () =>
      adminApi.setClinicHours(
        activeClinicId,
        hoursDraft.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          openTime: row.isClosed ? null : row.openTime,
          closeTime: row.isClosed ? null : row.closeTime,
          isClosed: row.isClosed,
        })),
      ),
    onSuccess: () => {
      setHoursOverrides({});
      void invalidateAll();
      setToast({ type: "success", message: "Clinic hours saved." });
    },
    onError: (error) => showError(error, "Failed to save clinic hours"),
  });

  const durationMutation = useMutation({
    mutationFn: ({
      id,
      minutes,
    }: {
      id: string;
      minutes: number;
    }) => adminApi.updateProcedureDuration(id, minutes),
    onSuccess: (_, variables) => {
      setDurationOverrides((previous) => {
        const next = { ...previous };
        delete next[variables.id];
        return next;
      });
      void invalidateAll();
    },
    onError: (error) => showError(error, "Failed to save procedure duration"),
  });

  const connectMutation = useMutation({
    mutationFn: ({
      ownerType,
      ownerId,
      provider,
    }: {
      ownerType: "DOCTOR" | "CLINIC";
      ownerId: string;
      provider: "GOOGLE" | "MICROSOFT";
    }) => adminApi.startCalendarConnect(ownerType, ownerId, provider),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error) => showError(error, "Failed to start calendar connect"),
  });

  const disconnectMutation = useMutation({
    mutationFn: ({
      ownerType,
      ownerId,
      provider,
    }: {
      ownerType: "DOCTOR" | "CLINIC";
      ownerId: string;
      provider: "GOOGLE" | "MICROSOFT";
    }) => adminApi.disconnectCalendar(ownerType, ownerId, provider),
    onSuccess: () => {
      void refetchDoctors();
      setToast({ type: "success", message: "Calendar disconnected." });
    },
    onError: (error) => showError(error, "Failed to disconnect calendar"),
  });

  const openAvailability = (doctor: AdminDoctor) => {
    setAvailabilityDoctor(doctor);
    setAvailabilityDraft(availabilityRows(doctor.availability ?? []));
  };

  const providerButtons = (
    ownerType: "DOCTOR" | "CLINIC",
    ownerId: string,
  ) => (
    <div className="flex flex-wrap gap-2">
      {(["GOOGLE", "MICROSOFT"] as const).map((provider) => {
        const configured =
          provider === "GOOGLE"
            ? providersData?.google.configured
            : providersData?.microsoft.configured;
        return (
          <div key={provider} className="flex items-center gap-1">
            <button
              type="button"
              disabled={!configured || connectMutation.isPending}
              title={
                configured
                  ? `Connect ${provider === "GOOGLE" ? "Google Calendar" : "Microsoft 365"}`
                  : `${provider} calendar credentials are not configured`
              }
              onClick={() =>
                connectMutation.mutate({ ownerType, ownerId, provider })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs"
            >
              <Link2 className="w-3.5 h-3.5" /> Connect {provider === "GOOGLE" ? "Google" : "MS365"}
            </button>
            <button
              type="button"
              disabled={!configured || disconnectMutation.isPending}
              title="Disconnect calendar"
              onClick={() =>
                disconnectMutation.mutate({ ownerType, ownerId, provider })
              }
              className="p-1.5 bg-transparent hover:bg-red-500/20 text-gray-400 hover:text-red-300 rounded disabled:opacity-40"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-emerald-500" />
          Booking setup
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage the doctors, working hours and service durations the MenoAI
          booking engine uses when it offers real availability slots. Slot spacing
          defaults to 20 minutes (15-minute consult + 5-minute buffer) and can be
          changed per doctor below.
        </p>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-300" htmlFor="booking-clinic">
          Clinic
        </label>
        <select
          id="booking-clinic"
          value={activeClinicId}
          onChange={(event) => {
            setClinicId(event.target.value);
            setHoursOverrides({});
            setAvailabilityDoctor(null);
          }}
          className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white min-w-64"
        >
          <option value="">Select a clinic…</option>
          {(clinics ?? []).map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
        {clinicsLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {!activeClinicId ? (
        <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl text-gray-300">
          Select a clinic to configure its booking settings.
        </div>
      ) : (
        <>
          <section className="p-5 bg-gray-800 border border-gray-700 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" /> Doctors
              </h2>
              {doctorsLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <label className="space-y-1 text-xs text-gray-400">
                Name
                <input
                  value={newDoctor.name}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, name: e.target.value })
                  }
                  placeholder="Dr. Achieng"
                  className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-gray-400">
                Title
                <input
                  value={newDoctor.title}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, title: e.target.value })
                  }
                  className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-gray-400">
                Specialty
                <input
                  value={newDoctor.specialty}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, specialty: e.target.value })
                  }
                  placeholder="General dentistry"
                  className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-gray-400">
                Consult (min)
                <input
                  type="number"
                  min={15}
                  value={newDoctor.consultationMinutes}
                  onChange={(e) =>
                    setNewDoctor({
                      ...newDoctor,
                      consultationMinutes: e.target.value,
                    })
                  }
                  className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                />
              </label>
              <button
                type="button"
                disabled={!newDoctor.name.trim() || createDoctorMutation.isPending}
                onClick={() => createDoctorMutation.mutate()}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-sm"
              >
                <Plus className="w-4 h-4" /> Add doctor
              </button>
            </div>

            {doctors.length === 0 ? (
              <p className="text-sm text-gray-400">
                No doctors configured for this clinic yet. The bot will offer
                clinic-wide slots until one is added.
              </p>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-3 bg-gray-900/60 border border-gray-700 rounded-lg"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {doctor.title ? `${doctor.title} ` : ""}
                          {doctor.name}
                          {!doctor.isActive && (
                            <span className="ml-2 text-xs text-amber-400">
                              inactive
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {doctor.specialty || "General dentistry"} ·{" "}
                          {doctor.consultationMinutes}m consult +{" "}
                          {doctor.bufferMinutes}m buffer
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDoctorMutation.mutate(doctor)}
                          className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                        >
                          {doctor.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openAvailability(doctor)}
                          className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                        >
                          Availability
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${doctor.name}? Appointments will remain but the doctor will no longer be offered.`,
                              )
                            ) {
                              deleteDoctorMutation.mutate(doctor.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                          title="Delete doctor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {availabilityDoctor?.id === doctor.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                        <p className="text-xs text-gray-300">
                          Working windows (local clinic time). Only active days
                          are offered by the bot.
                        </p>
                        {availabilityDraft.map((row) => (
                          <div
                            key={row.dayOfWeek}
                            className="flex items-center gap-3 text-xs text-gray-300"
                          >
                            <span className="w-20">{DAY_NAMES[row.dayOfWeek]}</span>
                            <input
                              type="time"
                              value={row.startTime}
                              onChange={(e) =>
                                setAvailabilityDraft(
                                  availabilityDraft.map((item) =>
                                    item.dayOfWeek === row.dayOfWeek
                                      ? { ...item, startTime: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                              className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={row.endTime}
                              onChange={(e) =>
                                setAvailabilityDraft(
                                  availabilityDraft.map((item) =>
                                    item.dayOfWeek === row.dayOfWeek
                                      ? { ...item, endTime: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                              className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white"
                            />
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={row.isActive}
                                onChange={(e) =>
                                  setAvailabilityDraft(
                                    availabilityDraft.map((item) =>
                                      item.dayOfWeek === row.dayOfWeek
                                        ? { ...item, isActive: e.target.checked }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              Active
                            </label>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            disabled={availabilityMutation.isPending}
                            onClick={() => availabilityMutation.mutate()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs"
                          >
                            <Save className="w-3.5 h-3.5" /> Save availability
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvailabilityDoctor(null)}
                            className="px-3 py-1.5 text-gray-300 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-gray-400">
                        External calendar sync (busy times are respected when
                        offering slots)
                      </p>
                      {providerButtons("DOCTOR", doctor.id)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="p-5 bg-gray-800 border border-gray-700 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-emerald-400" /> Clinic hours
              </h2>
              {hoursLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
            <div className="space-y-2">
              {hoursDraft.map((row) => (
                <div
                  key={row.dayOfWeek}
                  className="flex flex-wrap items-center gap-3 text-sm text-gray-300"
                >
                  <span className="w-20">{DAY_NAMES[row.dayOfWeek]}</span>
                  {!row.isClosed && (
                    <>
                      <input
                        type="time"
                        value={row.openTime}
                        onChange={(e) =>
                          setHoursRow(row.dayOfWeek, {
                            openTime: e.target.value,
                          })
                        }
                        className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={row.closeTime}
                        onChange={(e) =>
                          setHoursRow(row.dayOfWeek, {
                            closeTime: e.target.value,
                          })
                        }
                        className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                      />
                    </>
                  )}
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={row.isClosed}
                      onChange={(e) =>
                        setHoursRow(row.dayOfWeek, {
                          isClosed: e.target.checked,
                        })
                      }
                    />
                    Closed
                  </label>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={hoursMutation.isPending}
              onClick={() => hoursMutation.mutate()}
              className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
            >
              <Save className="w-4 h-4" /> Save clinic hours
            </button>
            <div className="pt-3 border-t border-gray-700 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-400">
                Clinic-level calendar (used when no doctor is assigned)
              </p>
              {providerButtons("CLINIC", activeClinicId)}
            </div>
          </section>

          <section className="p-5 bg-gray-800 border border-gray-700 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Procedure durations
              </h2>
              {proceduresLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            <p className="text-xs text-gray-400">
              Chair time used to block the calendar after a consultation. The
              default consultation is 15 minutes.
            </p>
            <div className="space-y-2">
              {procedures.map((procedure: AdminBookingProcedure) => (
                <div
                  key={procedure.id}
                  className="flex items-center justify-between gap-3 text-sm text-gray-300"
                >
                  <span>
                    <code className="text-gray-500 mr-2">{procedure.code}</code>
                    {procedure.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={durationValue(procedure)}
                      onChange={(e) =>
                        setDurationOverrides({
                          ...durationOverrides,
                          [procedure.id]: e.target.value,
                        })
                      }
                      className="w-20 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                    />
                    <span className="text-xs text-gray-400">min</span>
                    <button
                      type="button"
                      disabled={
                        durationMutation.isPending ||
                        Number(durationValue(procedure)) ===
                          procedure.durationMinutes
                      }
                      onClick={() =>
                        durationMutation.mutate({
                          id: procedure.id,
                          minutes: Number(durationValue(procedure)),
                        })
                      }
                      className="p-1.5 text-gray-300 hover:text-emerald-300 hover:bg-emerald-500/10 rounded disabled:opacity-30"
                      title="Save duration"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
