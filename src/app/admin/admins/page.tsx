"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Phone,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  adminApi,
  type AdminInviteResult,
  type AdminRole,
} from "@/lib/admin-api";
import { useAdminStore } from "@/lib/admin-store";

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super admin",
  JUNIOR_ADMIN: "Junior admin",
  CUSTOMER_SERVICE: "Customer service",
};

const ROLES: AdminRole[] = ["SUPER_ADMIN", "JUNIOR_ADMIN", "CUSTOMER_SERVICE"];

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { admin } = useAdminStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (admin && admin.role !== "SUPER_ADMIN") router.replace("/admin");
  }, [admin, router]);

  const [showCreate, setShowCreate] = useState(false);
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<AdminRole>("JUNIOR_ADMIN");
  const [invite, setInvite] = useState<AdminInviteResult | null>(null);
  const [copied, setCopied] = useState<"token" | "link" | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => adminApi.listAdminUsers(),
    enabled: admin?.role === "SUPER_ADMIN",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });

  const showError = (error: unknown, fallback: string) => {
    setToast({
      type: "error",
      message: error instanceof Error ? error.message : fallback,
    });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createAdminUser({
        username: username.trim(),
        role,
        phoneNumber: phoneNumber.trim() || undefined,
      }),
    onSuccess: (result) => {
      invalidate();
      setShowCreate(false);
      setUsername("");
      setPhoneNumber("");
      setRole("JUNIOR_ADMIN");
      setCopied(null);
      setInvite(result);
    },
    onError: (error) => showError(error, "Failed to create admin"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        role?: AdminRole;
        isActive?: boolean;
        phoneNumber?: string | null;
      };
    }) => adminApi.updateAdminUser(id, body),
    onSuccess: (_, variables) => {
      invalidate();
      setToast({
        type: "success",
        message:
          variables.body.phoneNumber !== undefined
            ? variables.body.phoneNumber
              ? "Admin phone saved. They can now use WhatsApp admin mode."
              : "Admin phone cleared. WhatsApp admin mode is disabled for this admin."
            : variables.body.isActive === false
              ? "Admin deactivated. Their sessions are no longer valid."
              : "Admin updated.",
      });
    },
    onError: (error) => showError(error, "Failed to update admin"),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => adminApi.resetAdminPassword(id),
    onSuccess: (result) => {
      invalidate();
      setCopied(null);
      setInvite(result);
    },
    onError: (error) => showError(error, "Failed to issue reset token"),
  });

  const inviteLink =
    invite && typeof window !== "undefined"
      ? `${window.location.origin}/accept-invite?token=${encodeURIComponent(invite.inviteToken)}`
      : "";

  const copy = async (value: string, kind: "token" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      showError(new Error("Clipboard unavailable — copy the value manually."), "");
    }
  };

  if (admin && admin.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6 text-gray-400">
        Only super admins can manage admin accounts.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Admin users
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Create admin accounts, assign roles and deactivate access. Passwords
            are never sent or stored in plain text. Set an admin&apos;s phone to
            the WhatsApp number they will use for <code>ADMIN</code> record
            access; a blank phone disables that access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setInvite(null);
            setShowCreate(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" /> Add admin
        </button>
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

      {invite && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-amber-200">
                One-time invite for {invite.admin.username}
              </h2>
              <p className="text-sm text-amber-200/80 mt-1">
                Send this link to the admin. It expires{" "}
                {formatDate(invite.expiresAt)} and cannot be retrieved again
                after you close this panel.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-900/60 rounded text-xs text-gray-200 break-all">
                {inviteLink}
              </code>
              <button
                type="button"
                onClick={() => copy(inviteLink, "link")}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white inline-flex items-center gap-1"
              >
                {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy link
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-900/60 rounded text-xs text-gray-300 break-all">
                {invite.inviteToken}
              </code>
              <button
                type="button"
                onClick={() => copy(invite.inviteToken, "token")}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white inline-flex items-center gap-1"
              >
                {copied === "token" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy token
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInvite(null)}
            className="text-sm text-amber-200 underline"
          >
            I have saved the invite
          </button>
        </div>
      )}

      {showCreate && (
        <div className="p-5 bg-gray-800 border border-gray-700 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-white">New admin account</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1 text-sm text-gray-300">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="junior.dev"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-300">
              Phone number (optional)
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="254712345678"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              />
            </label>
            <label className="space-y-1 text-sm text-gray-300">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              >
                {ROLES.map((option) => (
                  <option key={option} value={option}>
                    {ROLE_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!username.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create &amp; generate invite
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : admins && admins.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-900/50 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {admins.map((item) => (
                <tr key={item.id} className="text-gray-200">
                  <td className="px-4 py-3 font-medium">
                    {item.username}
                    {item.id === admin?.id && (
                      <span className="ml-2 text-xs text-gray-500">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {item.phoneNumber || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.role}
                      disabled={item.id === admin?.id}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: item.id,
                          body: { role: e.target.value as AdminRole },
                        })
                      }
                      className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {ROLES.map((option) => (
                        <option key={option} value={option}>
                          {ROLE_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.isActive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {item.isActive ? "Active" : "Deactivated"}
                    </span>
                    {item.mustChangePassword && (
                      <span className="ml-2 text-xs text-amber-400">
                        invite pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(item.lastLogin)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={item.id === admin?.id}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Deactivate ${item.username}? Their sessions will stop working immediately.`,
                            )
                          ) {
                            updateMutation.mutate({
                              id: item.id,
                              body: { isActive: false },
                            });
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded"
                      >
                        {item.isActive ? "Deactivate" : "Deactivated"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const entered = window.prompt(
                            `WhatsApp phone for ${item.username} (9-15 digits, e.g. 254712345678). Leave blank to disable admin mode for this account.`,
                            item.phoneNumber ?? "",
                          );
                          if (entered === null) return;
                          const phone = entered.trim();
                          if (phone && !/^\+?\d{9,15}$/.test(phone)) {
                            showError(
                              new Error(
                                "Phone number must be 9-15 digits, optionally prefixed with +.",
                              ),
                              "",
                            );
                            return;
                          }
                          updateMutation.mutate({
                            id: item.id,
                            body: { phoneNumber: phone || null },
                          });
                        }}
                        className="px-2 py-1 text-xs bg-sky-900/60 hover:bg-sky-800 text-sky-200 rounded inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Set phone
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Issue a new password reset token for ${item.username}?`,
                            )
                          ) {
                            resetMutation.mutate(item.id);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 rounded inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" /> Reset password
                      </button>
                      {!item.isActive && (
                        <button
                          type="button"
                          onClick={() =>
                            updateMutation.mutate({
                              id: item.id,
                              body: { isActive: true },
                            })
                          }
                          className="px-2 py-1 text-xs bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-gray-400">No admin accounts yet.</p>
        )}
      </div>
    </div>
  );
}
