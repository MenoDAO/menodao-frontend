"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { useAdminStore } from "@/lib/admin-store";
import { PasskeyManager } from "@/components/PasskeyManager";
import { ActivityTimeline } from "@/components/settings/ActivityTimeline";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { formatDateTime } from "@/lib/activity";
import {
  Clock,
  Landmark,
  Loader2,
  Shield,
  User,
} from "lucide-react";

function roleLabel(role?: string) {
  if (role === "CUSTOMER_SERVICE") return "Customer service";
  if (role === "SUPER_ADMIN") return "Super admin";
  return "Administrator";
}

function accessCopy(role?: string) {
  if (role === "CUSTOMER_SERVICE") {
    return "Member support, operations, and read access across Care Intelligence";
  }
  return "Full platform access, including sensitive member and payment actions";
}

export default function SettingsPage() {
  const { admin } = useAdminStore();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: () => adminApi.getProfile(),
  });

  const activity = useQuery({
    queryKey: ["admin", "my-activity"],
    queryFn: () => adminApi.getMyActivity(20),
  });

  const role = profile?.role || admin?.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-gray-400">
          Your profile, organization, sign-in, and a log of your recent actions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Your profile</h2>
          {profileLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
                  {(profile?.username || admin?.username || "A")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    {profile?.username || admin?.username}
                  </p>
                  <p className="text-gray-400">{roleLabel(role)}</p>
                </div>
              </div>
              <dl className="space-y-3 border-t border-gray-700 pt-4 text-sm">
                <div className="flex items-start gap-3 text-gray-300">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                  <div>
                    <dt className="text-xs text-gray-500">Username</dt>
                    <dd>{profile?.username}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                  <div>
                    <dt className="text-xs text-gray-500">Access</dt>
                    <dd>{accessCopy(role)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                  <div>
                    <dt className="text-xs text-gray-500">Last sign-in</dt>
                    <dd>{formatDateTime(profile?.lastLogin)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                  <div>
                    <dt className="text-xs text-gray-500">Account created</dt>
                    <dd>{formatDateTime(profile?.createdAt)}</dd>
                  </div>
                </div>
              </dl>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Organization
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            Admins operate MenoDAO at the platform layer, not a single clinic
          </p>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-white">MenoDAO Care</p>
              <p className="text-sm text-gray-400">
                Platform operations · Kenya
              </p>
            </div>
          </div>
          <dl className="mt-4 space-y-3 border-t border-gray-700 pt-4 text-sm text-gray-300">
            <div>
              <dt className="text-xs text-gray-500">Workspace</dt>
              <dd>Care Intelligence, clinics, members, and payouts</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Your seat</dt>
              <dd>{roleLabel(role)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Sensitive actions</dt>
              <dd>
                Member suspends, payment verification, and similar ops are
                recorded on your activity timeline
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChangePasswordCard
          tone="dark"
          minLength={8}
          onSubmit={(currentPassword, newPassword) =>
            adminApi.changePassword(currentPassword, newPassword)
          }
        />
        <PasskeyManager
          queryKey="admin"
          kind="admin"
          tone="dark"
          list={() => adminApi.listPasskeys()}
          getOptions={() => adminApi.webauthnRegisterOptions()}
          verify={(credential, label) =>
            adminApi.webauthnRegisterVerify(credential, label)
          }
          remove={(id) => adminApi.deletePasskey(id)}
        />
      </div>

      <ActivityTimeline
        tone="dark"
        title="Your activity"
        subtitle="Actions you took on members, payments, and subscriptions"
        items={activity.data?.items}
        isLoading={activity.isLoading}
        error={activity.isError}
        empty="No recorded actions on this admin account yet. Sensitive ops you perform will appear here."
      />
    </div>
  );
}
