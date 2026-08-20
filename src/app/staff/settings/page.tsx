"use client";

import { useQuery } from "@tanstack/react-query";
import { staffApi } from "@/lib/staff-api";
import { useStaffStore } from "@/lib/staff-store";
import { PasskeyManager } from "@/components/PasskeyManager";
import { ActivityTimeline } from "@/components/settings/ActivityTimeline";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { formatDateTime } from "@/lib/activity";
import {
  Building2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { useEffect } from "react";

function roleLabel(role?: string) {
  if (role === "ADMIN") return "Clinic admin";
  return "Clinic staff";
}

function statusLabel(status?: string) {
  if (status === "APPROVED") return "Approved partner";
  if (status === "PENDING") return "Pending approval";
  if (status === "SUSPENDED") return "Suspended";
  if (status === "REJECTED") return "Rejected";
  return status || "Clinic";
}

export default function StaffSettingsPage() {
  const token = useStaffStore((state) => state.token);
  const setStaff = useStaffStore((state) => state.setStaff);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["staff", "profile"],
    queryFn: () => staffApi.getProfile(),
  });

  const activity = useQuery({
    queryKey: ["staff", "activity"],
    queryFn: () => staffApi.getActivity(20),
  });

  useEffect(() => {
    if (profile && token) {
      setStaff(profile, token);
    }
  }, [profile, token, setStaff]);

  const clinic = profile?.clinic;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Your profile, clinic, sign-in, and recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Your profile
            </h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {(profile?.fullName || profile?.username || "S")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-medium text-gray-900 dark:text-white">
                    {profile?.fullName || "Staff"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {roleLabel(profile?.role)}
                  </p>
                </div>
              </div>
              <dl className="space-y-3 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      Username
                    </dt>
                    <dd>{profile?.username}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      Access
                    </dt>
                    <dd>
                      {profile?.role === "ADMIN"
                        ? "Check-in, appointments, and clinic admin tools"
                        : "Check-in, appointments, and treatment records"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      Last sign-in
                    </dt>
                    <dd>{formatDateTime(profile?.lastLogin)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      Account created
                    </dt>
                    <dd>{formatDateTime(profile?.createdAt)}</dd>
                  </div>
                </div>
              </dl>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Clinic
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The partner clinic this login is attached to
            </p>
          </div>
          {!clinic ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
              This account is not linked to a clinic yet. Ask a clinic admin to
              attach it so check-ins and appointments stay in the right place.
              {profile?.branch ? (
                <p className="mt-3">Branch label: {profile.branch}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {clinic.name}
                    {clinic.branchName ? ` · ${clinic.branchName}` : ""}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {statusLabel(clinic.status)}
                    {clinic.parentClinic
                      ? ` · Branch of ${clinic.parentClinic.name}`
                      : ""}
                  </p>
                </div>
              </div>
              <dl className="space-y-3 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      Location
                    </dt>
                    <dd>
                      {[clinic.physicalLocation, clinic.subCounty]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                </div>
                {clinic.operatingHours && (
                  <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Hours
                      </dt>
                      <dd>
                        {clinic.operatingHours}
                        {clinic.operatesOnWeekends ? " · Open weekends" : ""}
                      </dd>
                    </div>
                  </div>
                )}
                {clinic.leadDentistName && (
                  <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Lead dentist
                      </dt>
                      <dd>{clinic.leadDentistName}</dd>
                    </div>
                  </div>
                )}
                {(clinic.whatsappNumber || clinic.email) && (
                  <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    {clinic.email ? (
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    )}
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Clinic contact
                      </dt>
                      <dd>
                        {[clinic.whatsappNumber, clinic.email]
                          .filter(Boolean)
                          .join(" · ")}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChangePasswordCard
          minLength={6}
          onSubmit={(currentPassword, newPassword) =>
            staffApi.changePassword(currentPassword, newPassword)
          }
        />
        <PasskeyManager
          queryKey="staff"
          kind="staff"
          list={() => staffApi.listPasskeys()}
          getOptions={() => staffApi.webauthnRegisterOptions()}
          verify={(credential, label) =>
            staffApi.webauthnRegisterVerify(credential, label)
          }
          remove={(id) => staffApi.deletePasskey(id)}
        />
      </div>

      <ActivityTimeline
        items={activity.data?.items}
        isLoading={activity.isLoading}
        error={activity.isError}
        empty="No clinic activity on this account yet. Check-ins, discharges, and appointment actions will show here."
      />
    </div>
  );
}
