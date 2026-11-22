"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ClipboardCheck,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import {
  adminApi,
  type FieldContributor,
  type FieldContributorRole,
  type FieldSubmission,
  type FieldSubmissionStatus,
} from "@/lib/admin-api";

const ROLE_LABELS: Record<FieldContributorRole, string> = {
  DOCTOR: "Doctor",
  PHYSICIAN: "Physician",
  HEALTH_PERSONNEL: "Health personnel",
  NURSE: "Nurse",
};
const ROLES = Object.keys(ROLE_LABELS) as FieldContributorRole[];
const STATUSES: FieldSubmissionStatus[] = [
  "PENDING",
  "PARSED",
  "NEEDS_REVIEW",
  "PROCESSED",
  "REJECTED",
];

type Toast = { type: "success" | "error"; message: string };
type ContributorForm = {
  phoneNumber: string;
  displayName: string;
  role: FieldContributorRole;
  organization: string;
  isActive: boolean;
};

const EMPTY_FORM: ContributorForm = {
  phoneNumber: "",
  displayName: "",
  role: "HEALTH_PERSONNEL",
  organization: "",
  isActive: true,
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatConfidence(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value <= 1 ? value * 100 : value)}%`;
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function pretty(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Accepts 9–15 digits, with an optional + prefix and common separators. */
function isValidPhone(value: string): boolean {
  return /^\+?\d{9,15}$/.test(value.replace(/[\s\-()]/g, ""));
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function StatusBadge({ status }: { status: FieldSubmissionStatus }) {
  const tone =
    status === "PROCESSED"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "REJECTED"
        ? "bg-red-500/15 text-red-400"
        : status === "NEEDS_REVIEW"
          ? "bg-orange-500/15 text-orange-400"
          : status === "PARSED"
            ? "bg-sky-500/15 text-sky-400"
            : "bg-amber-500/15 text-amber-400";
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function MediaPreview({
  submission,
  url,
  error,
}: {
  submission: FieldSubmission;
  url: string | null;
  error: string | null;
}) {
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!url)
    return (
      <p className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading media…
      </p>
    );

  switch (submission.kind) {
    case "IMAGE":
      return (
        // Blob URL from the authenticated media endpoint — never a public URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={submission.originalFilename ?? "Field submission image"}
          className="max-h-96 max-w-full rounded-lg border border-gray-700 object-contain"
        />
      );
    case "VIDEO":
      return (
        <video
          controls
          src={url}
          className="max-h-96 max-w-full rounded-lg border border-gray-700"
        />
      );
    case "AUDIO":
      return <audio controls src={url} className="w-full" />;
    case "DOCUMENT":
      return (
        <a
          href={url}
          download={submission.originalFilename ?? "document"}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
        >
          <FileText className="h-4 w-4" />
          {submission.originalFilename ?? "Download document"}
        </a>
      );
  }
}

export default function FieldDataPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"submissions" | "contributors">("submissions");
  const [statusFilter, setStatusFilter] = useState<FieldSubmissionStatus | "">(
    "",
  );
  const [contributorFilter, setContributorFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContributorForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "field-data"] });

  const { data: contributors = [], isLoading: contributorsLoading } = useQuery({
    queryKey: ["admin", "field-data", "contributors"],
    queryFn: () => adminApi.listFieldDataContributors(),
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: [
      "admin",
      "field-data",
      "submissions",
      statusFilter,
      contributorFilter,
    ],
    queryFn: () =>
      adminApi.listFieldDataSubmissions({
        status: statusFilter || undefined,
        contributorId: contributorFilter || undefined,
        limit: 200,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin", "field-data", "submission-detail", selectedId],
    queryFn: () => adminApi.getFieldDataSubmission(selectedId as string),
    enabled: !!selectedId,
  });

  const openSubmission = (id: string) => {
    setReviewNotes("");
    setMediaUrl(null);
    setMediaError(null);
    setSelectedId(id);
  };

  const closeSubmission = () => {
    setSelectedId(null);
    setMediaUrl(null);
    setMediaError(null);
  };

  // Media is fetched with the admin JWT and turned into a local blob URL —
  // it is revoked as soon as the detail panel closes or the selection changes.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    adminApi
      .getFieldDataMediaBlob(selectedId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setMediaUrl(objectUrl);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMediaError(errorMessage(error, "Media unavailable."));
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedId]);

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "PROCESSED" | "REJECTED" | "NEEDS_REVIEW";
      notes?: string;
    }) =>
      adminApi.reviewFieldDataSubmission(id, {
        status,
        reviewNotes: notes?.trim() || undefined,
      }),
    onSuccess: (updated) => {
      refresh();
      setReviewNotes("");
      setToast({
        type: "success",
        message: `Submission marked ${updated.status.replace("_", " ").toLowerCase()}.`,
      });
    },
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Failed to save review."),
      }),
  });

  const reparseMutation = useMutation({
    mutationFn: (id: string) => adminApi.reparseFieldDataSubmission(id),
    onSuccess: () => {
      refresh();
      setToast({ type: "success", message: "Reparse queued." });
    },
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Failed to reparse submission."),
      }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (contributor: FieldContributor) => {
    setForm({
      phoneNumber: contributor.phoneNumber,
      displayName: contributor.displayName,
      role: contributor.role,
      organization: contributor.organization ?? "",
      isActive: contributor.isActive,
    });
    setEditingId(contributor.id);
    setFormError(null);
    setShowForm(true);
  };

  const saveContributorMutation = useMutation({
    mutationFn: () =>
      editingId
        ? adminApi.updateFieldDataContributor(editingId, {
            displayName: form.displayName.trim(),
            role: form.role,
            organization: form.organization.trim() || null,
            isActive: form.isActive,
          })
        : adminApi.createFieldDataContributor({
            phoneNumber: form.phoneNumber.replace(/[\s\-()]/g, ""),
            displayName: form.displayName.trim(),
            role: form.role,
            organization: form.organization.trim() || undefined,
          }),
    onSuccess: () => {
      refresh();
      resetForm();
      setToast({
        type: "success",
        message: editingId ? "Contributor updated." : "Contributor authorized.",
      });
    },
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Failed to save contributor."),
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateFieldDataContributor(id, { isActive }),
    onSuccess: refresh,
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Failed to change contributor status."),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFieldDataContributor(id),
    onSuccess: () => {
      refresh();
      if (editingId) resetForm();
      setToast({ type: "success", message: "Contributor removed." });
    },
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Failed to remove contributor."),
      }),
  });

  const submitContributor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidPhone(form.phoneNumber)) {
      setFormError("Enter 9–15 phone digits, optionally prefixed with +.");
      return;
    }
    if (!form.displayName.trim()) {
      setFormError("Display name is required.");
      return;
    }
    setFormError(null);
    saveContributorMutation.mutate();
  };

  const busy = reviewMutation.isPending || reparseMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <ClipboardCheck className="h-6 w-6 text-emerald-500" />
          Field data intake
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Review restricted WhatsApp submissions from authorized health
          personnel and manage who is allowed to submit.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-200">
            Restricted clinical intake — authorized health personnel only
          </p>
          <p className="mt-1 text-xs text-amber-200/80">
            Media is served exclusively through authenticated admin requests.
            Do not share, download, or redistribute patient material outside
            this review workflow.
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-700">
        {(
          [
            ["submissions", "Submissions"],
            ["contributors", "Authorized contributors"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "submissions" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-700 bg-gray-800 p-4">
            <label className="space-y-1 text-xs text-gray-400">
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as FieldSubmissionStatus | "")
                }
                className="block min-w-40 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
              >
                <option value="">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-gray-400">
              Contributor
              <select
                value={contributorFilter}
                onChange={(event) => setContributorFilter(event.target.value)}
                className="block min-w-56 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
              >
                <option value="">All contributors</option>
                {contributors.map((contributor) => (
                  <option key={contributor.id} value={contributor.id}>
                    {contributor.displayName} · {contributor.phoneNumber}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <span className="ml-auto text-xs text-gray-500">
              {submissions.length} submission{submissions.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
            {submissionsLoading ? (
              <div className="flex justify-center p-8 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : submissions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/50 text-left text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Contributor</th>
                      <th className="px-4 py-3">Kind</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {submissions.map((submission) => (
                      <tr
                        key={submission.id}
                        onClick={() => openSubmission(submission.id)}
                        className="cursor-pointer text-gray-200 hover:bg-gray-700/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                          {formatDate(submission.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">
                            {submission.contributor.displayName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {submission.contributor.organization ??
                              submission.contributor.phoneNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-300">
                          {submission.kind}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={submission.status} />
                            {submission.needsAdminReview && (
                              <span className="text-xs text-amber-400">
                                review flagged
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-300">
                          {formatConfidence(submission.confidence)}
                        </td>
                        <td
                          className="max-w-md truncate px-4 py-3 text-gray-300"
                          title={submission.summary ?? ""}
                        >
                          {submission.summary || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-gray-400">No submissions found.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-gray-400">
              Only these phone numbers may submit field data over WhatsApp.
              Deactivating a contributor blocks new submissions but keeps their
              existing records available for review.
            </p>
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Add contributor
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={submitContributor}
              className="space-y-4 rounded-xl border border-gray-700 bg-gray-800 p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? "Edit contributor" : "New contributor"}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="Close form"
                  className="rounded p-1 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-300">
                  Phone number
                  <input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm({ ...form, phoneNumber: event.target.value })
                    }
                    disabled={!!editingId}
                    placeholder="254712345678"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white disabled:opacity-50"
                  />
                  {editingId && (
                    <span className="block text-xs text-gray-500">
                      Phone number cannot be changed after creation.
                    </span>
                  )}
                </label>
                <label className="space-y-1 text-sm text-gray-300">
                  Display name
                  <input
                    value={form.displayName}
                    onChange={(event) =>
                      setForm({ ...form, displayName: event.target.value })
                    }
                    placeholder="Dr. Amina Hassan"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-300">
                  Role
                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role: event.target.value as FieldContributorRole,
                      })
                    }
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-gray-300">
                  Organization (optional)
                  <input
                    value={form.organization}
                    onChange={(event) =>
                      setForm({ ...form, organization: event.target.value })
                    }
                    placeholder="Clinic or facility"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                  className="h-4 w-4 accent-emerald-500"
                />
                Active (allowed to submit)
              </label>
              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saveContributorMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saveContributorMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingId ? "Save changes" : "Authorize contributor"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
            {contributorsLoading ? (
              <div className="flex justify-center p-8 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : contributors.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/50 text-left text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Added</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {contributors.map((contributor) => (
                      <tr key={contributor.id} className="text-gray-200">
                        <td className="px-4 py-3 font-medium text-white">
                          {contributor.phoneNumber}
                        </td>
                        <td className="px-4 py-3">{contributor.displayName}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {ROLE_LABELS[contributor.role]}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {contributor.organization ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: contributor.id,
                                isActive: !contributor.isActive,
                              })
                            }
                            className={`rounded-full px-2 py-1 text-xs ${
                              contributor.isActive
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {contributor.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDate(contributor.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(contributor)}
                              className="inline-flex items-center gap-1 rounded bg-sky-900/60 px-2 py-1 text-xs text-sky-200 hover:bg-sky-800"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${contributor.displayName}? Their submissions remain in the review queue.`,
                                  )
                                ) {
                                  deleteMutation.mutate(contributor.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded bg-red-900/60 px-2 py-1 text-xs text-red-200 hover:bg-red-800"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-gray-400">
                No authorized contributors yet. Add one to start collecting
                field data.
              </p>
            )}
          </div>
        </div>
      )}

      {selectedId && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60"
          onClick={closeSubmission}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-gray-700 bg-gray-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Submission detail
                </h2>
                <p className="mt-1 break-all text-xs text-gray-500">
                  {selectedId}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSubmission}
                aria-label="Close detail"
                className="rounded p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading || !detail ? (
              <div className="flex h-64 items-center justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Received</p>
                    <p className="text-gray-200">
                      {formatDate(detail.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contributor</p>
                    <p className="text-gray-200">
                      {detail.contributor.displayName}
                      <span className="block text-xs text-gray-500">
                        {detail.contributor.phoneNumber}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Kind</p>
                    <p className="text-gray-200">{detail.kind}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <StatusBadge status={detail.status} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Confidence</p>
                    <p className="text-gray-200">
                      {formatConfidence(detail.confidence)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Linked member</p>
                    <p className="break-all text-gray-200">
                      {detail.memberId ?? "—"}
                    </p>
                  </div>
                </div>

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    Media preview
                  </h3>
                  <div className="rounded-lg border border-gray-700 bg-black/30 p-4">
                    <MediaPreview
                      submission={detail}
                      url={mediaUrl}
                      error={mediaError}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {detail.mimeType} · {formatBytes(detail.fileSize)} ·{" "}
                    {detail.originalFilename ?? "unnamed"}
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    Caption
                  </h3>
                  <p className="whitespace-pre-wrap rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-gray-300">
                    {detail.caption || "—"}
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    Extracted data
                  </h3>
                  <pre className="max-h-80 overflow-auto rounded-lg border border-gray-700 bg-gray-950 p-4 text-xs text-emerald-200">
                    {pretty(detail.extracted)}
                  </pre>
                  {detail.summary && (
                    <p className="mt-2 text-sm text-gray-300">
                      {detail.summary}
                    </p>
                  )}
                </section>

                {detail.missingFields.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-white">
                      Missing fields
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {detail.missingFields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-400"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {detail.parseError && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-white">
                      Parse error
                    </h3>
                    <p className="whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                      {detail.parseError}
                    </p>
                  </section>
                )}

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Review</h3>
                  {detail.reviewedAt && (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Check className="h-3 w-3" /> Reviewed{" "}
                      {formatDate(detail.reviewedAt)}
                      {detail.reviewerAdminId
                        ? ` by ${detail.reviewerAdminId}`
                        : ""}
                    </p>
                  )}
                  {detail.reviewNotes && (
                    <p className="whitespace-pre-wrap rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-gray-300">
                      {detail.reviewNotes}
                    </p>
                  )}
                  <textarea
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    placeholder="Review notes (recommended for rejects)"
                    rows={3}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: detail.id,
                          status: "PROCESSED",
                          notes: reviewNotes,
                        })
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Approve / Process
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: detail.id,
                          status: "NEEDS_REVIEW",
                          notes: reviewNotes,
                        })
                      }
                      className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                    >
                      Flag needs review
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: detail.id,
                          status: "REJECTED",
                          notes: reviewNotes,
                        })
                      }
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => reparseMutation.mutate(detail.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" /> Reparse
                    </button>
                  </div>
                </section>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
