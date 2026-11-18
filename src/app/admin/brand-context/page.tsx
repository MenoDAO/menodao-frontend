"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  History,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  adminApi,
  type AdminBrandContextDocument,
  type AdminBrandContextVersion,
  type BrandContextPreview,
  type CreateBrandContextBody,
  type ImportBrandContextBody,
} from "@/lib/admin-api";
import { useAdminStore } from "@/lib/admin-store";

const KIND_OPTIONS = [
  "BRAND",
  "ETHICS",
  "OPERATING",
  "CLINICAL",
  "POLICY",
  "BIBLE",
] as const;

const STATUS_OPTIONS = ["ALL", "true", "false"] as const;

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function AdminBrandContextPage() {
  const { admin } = useAdminStore();
  const canWrite = admin?.role === "SUPER_ADMIN";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AdminBrandContextDocument | null>(
    null,
  );
  const [draft, setDraft] = useState<CreateBrandContextBody>({
    kind: "BIBLE",
    content: "",
    active: true,
    title: "",
  });

  const [showImport, setShowImport] = useState(false);
  const [importDraft, setImportDraft] = useState<ImportBrandContextBody>({
    kind: "BIBLE",
    content: "",
    active: true,
  });

  const [deleteTarget, setDeleteTarget] =
    useState<AdminBrandContextDocument | null>(null);

  const [historyDoc, setHistoryDoc] =
    useState<AdminBrandContextDocument | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const [previewQuery, setPreviewQuery] = useState("");
  const [previewKind, setPreviewKind] = useState<string>("ALL");
  const [previewTopK, setPreviewTopK] = useState<number>(3);
  const [previewResult, setPreviewResult] =
    useState<BrandContextPreview | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin", "brand-context", kindFilter, statusFilter, search],
    queryFn: () =>
      adminApi.listBrandContexts({
        kind: kindFilter === "ALL" ? undefined : kindFilter,
        active: statusFilter === "ALL" ? undefined : statusFilter === "true",
        search: search.trim() || undefined,
      }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "brand-context"] });

  const versionsQuery = useQuery({
    queryKey: ["admin", "brand-context", "versions", historyDoc?.id],
    queryFn: () => adminApi.listBrandContextVersions(historyDoc?.id ?? ""),
    enabled: Boolean(historyDoc?.id),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateBrandContextBody) =>
      adminApi.createBrandContext(body),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setToast({ type: "success", message: "Context document created." });
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create context document",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<CreateBrandContextBody>;
    }) => adminApi.updateBrandContext(id, body),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setEditingDoc(null);
      setToast({ type: "success", message: "Context document updated." });
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update context document",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBrandContext(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      setToast({ type: "success", message: "Context document deleted." });
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete context",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      adminApi.restoreBrandContextVersion(id, version),
    onSuccess: (restored, variables) => {
      invalidate();
      queryClient.invalidateQueries({
        queryKey: ["admin", "brand-context", "versions"],
      });
      setSelectedVersion(restored.version);
      setToast({
        type: "success",
        message: `Restored v${variables.version} as v${restored.version}.`,
      });
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to restore version",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: (body: ImportBrandContextBody) =>
      adminApi.importBrandContext(body),
    onSuccess: (result) => {
      invalidate();
      setShowImport(false);
      setToast({
        type: "success",
        message: `Imported into ${importDraft.kind} — ${result.created} created, ${result.updated} updated, ${result.deactivated} deactivated.`,
      });
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to import guide",
      });
    },
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      adminApi.previewBrandContext(
        previewQuery,
        previewKind === "ALL" ? undefined : previewKind,
        previewTopK || 3,
      ),
    onSuccess: (result) => setPreviewResult(result),
    onError: (error: unknown) => {
      setPreviewResult(null);
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to preview context retrieval",
      });
    },
  });

  const openCreate = () => {
    setEditingDoc(null);
    setDraft({ kind: "BIBLE", content: "", active: true, title: "" });
    setShowCreate(true);
  };

  const openEdit = (doc: AdminBrandContextDocument) => {
    setEditingDoc(doc);
    setDraft({
      kind: doc.kind,
      title: doc.title ?? "",
      content: doc.content,
      active: doc.active,
      source: doc.source,
    });
    setShowCreate(true);
  };

  const openHistory = (doc: AdminBrandContextDocument) => {
    setHistoryDoc(doc);
    setSelectedVersion(doc.version);
  };

  const selectedSnapshot = (versionsQuery.data ?? []).find(
    (entry: AdminBrandContextVersion) => entry.version === selectedVersion,
  );
  const latestVersion = versionsQuery.data?.[0]?.version;

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    importMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <BookOpen className="h-6 w-6 text-emerald-400" />
            Brand Context
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-400">
            Retrievable knowledge base the assistant grounds its replies in —
            brand voice, ethics, operating principles, clinical protocols and
            policies. Other AI features can consume these same sections.
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
            >
              <Upload size={16} />
              Import guide
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              New context
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            className="text-xs opacity-70 hover:opacity-100"
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title or content"
            className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <select
          value={kindFilter}
          onChange={(event) => setKindFilter(event.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"
        >
          <option value="ALL">All kinds</option>
          {KIND_OPTIONS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "ALL"
                ? "All statuses"
                : status === "true"
                  ? "Active"
                  : "Inactive"}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            Context documents ({documents?.length ?? 0})
          </h2>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>
        {!isLoading && (!documents || documents.length === 0) && (
          <p className="text-sm text-gray-400">
            No context documents yet. Import a guide or create one manually — the
            bot only grounds replies in active documents.
          </p>
        )}
        <div className="space-y-3">
          {(documents ?? []).map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border border-white/10 bg-black/30 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {doc.title || "Untitled"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-300">
                      {doc.kind}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-300">
                      {doc.source}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${
                        doc.active
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/5 text-gray-400"
                      }`}
                    >
                      {doc.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    v{doc.version} · updated {formatDateTime(doc.updatedAt)} ·{" "}
                    {doc.content.length} chars
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openHistory(doc)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-gray-200 hover:bg-white/10"
                  >
                    <History className="h-3.5 w-3.5" />
                    History
                  </button>
                  {canWrite && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(doc)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-gray-200 hover:bg-white/10"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(doc)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-gray-400">
                {doc.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            Retrieval preview
          </h2>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <input
              value={previewQuery}
              onChange={(event) => setPreviewQuery(event.target.value)}
              placeholder="Simulate a member question, e.g. what should I do about pain?"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <select
            value={previewKind}
            onChange={(event) => setPreviewKind(event.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="ALL">All kinds</option>
            {KIND_OPTIONS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
          <select
            value={previewTopK}
            onChange={(event) => setPreviewTopK(Number(event.target.value))}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"
          >
            {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                Top {value}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => previewMutation.mutate()}
            disabled={!previewQuery.trim() || previewMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/20 disabled:opacity-40"
          >
            {previewMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Preview
          </button>
        </div>
        {previewResult && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-400">
              Scanned {previewResult.scanned} document(s) · matched{" "}
              {previewResult.matched.length} · injected {previewResult.injectedChars}{" "}
              chars in {previewResult.elapsedMs}ms
            </p>
            {previewResult.matched.length === 0 && (
              <p className="text-sm text-gray-400">
                No context matched this query yet.
              </p>
            )}
            {previewResult.matched.map((match) => (
              <div
                key={match.documentId}
                className="rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">
                    {match.title || "Untitled"}
                  </span>
                  <span className="text-xs text-gray-400">
                    score {match.score.toFixed(4)} · {match.kind}
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-gray-400">
                  {match.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-black/60 py-8 px-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
              <h2 className="text-lg font-bold text-white">
                {editingDoc ? "Edit context document" : "New context document"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditingDoc(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block text-sm text-gray-300">
                Title
                <input
                  value={draft.title ?? ""}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
              <label className="block text-sm text-gray-300">
                Kind
                <select
                  value={draft.kind ?? "BIBLE"}
                  onChange={(event) =>
                    setDraft({ ...draft, kind: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  {KIND_OPTIONS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-gray-300">
                Content
                <textarea
                  value={draft.content}
                  onChange={(event) =>
                    setDraft({ ...draft, content: event.target.value })
                  }
                  rows={12}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={draft.active ?? true}
                  onChange={(event) =>
                    setDraft({ ...draft, active: event.target.checked })
                  }
                  className="h-4 w-4 accent-emerald-500"
                />
                Active (retrievable by the assistant)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setEditingDoc(null);
                  }}
                  className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!draft.content.trim() || isSaving}
                  onClick={() =>
                    editingDoc
                      ? updateMutation.mutate({
                          id: editingDoc.id,
                          body: {
                            kind: draft.kind,
                            title: draft.title || undefined,
                            content: draft.content,
                            active: draft.active,
                          },
                        })
                      : createMutation.mutate({
                          kind: draft.kind,
                          title: draft.title || undefined,
                          content: draft.content,
                          active: draft.active,
                        })
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingDoc ? "Save changes" : "Create document"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-black/60 py-8 px-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
              <h2 className="text-lg font-bold text-white">
                Import guide as context sections
              </h2>
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-xs text-gray-400">
                Markdown headings become one retrievable document per section.
              </p>
              <label className="block text-sm text-gray-300">
                Kind
                <select
                  value={importDraft.kind ?? "BIBLE"}
                  onChange={(event) =>
                    setImportDraft({ ...importDraft, kind: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  {KIND_OPTIONS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-gray-300">
                Title (fallback for sections without a heading)
                <input
                  value={importDraft.title ?? ""}
                  onChange={(event) =>
                    setImportDraft({ ...importDraft, title: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
              <label className="block text-sm text-gray-300">
                Guide content (markdown)
                <textarea
                  value={importDraft.content}
                  onChange={(event) =>
                    setImportDraft({ ...importDraft, content: event.target.value })
                  }
                  rows={14}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImport(false)}
                  className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importDraft.content.trim() || importMutation.isPending}
                  onClick={() => importMutation.mutate(importDraft)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
                >
                  {importMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyDoc && (
        <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8">
          <div className="relative w-full max-w-4xl rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-white">Version history</h2>
                <p className="mt-1 text-xs text-gray-400">
                  {historyDoc.title || "Untitled"} · {historyDoc.kind} · current
                  v{historyDoc.version}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDoc(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                {versionsQuery.isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
                {!versionsQuery.isLoading &&
                  (versionsQuery.data?.length ?? 0) === 0 && (
                    <p className="text-xs text-gray-400">
                      No versions recorded yet. History starts with the next
                      change.
                    </p>
                  )}
                {(versionsQuery.data ?? []).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedVersion(entry.version)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                      entry.version === selectedVersion
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-black/30 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">v{entry.version}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        {entry.changeType}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] text-gray-400">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                {selectedSnapshot ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {selectedSnapshot.title || "Untitled"}
                        </p>
                        <p className="text-xs text-gray-400">
                          v{selectedSnapshot.version} ·{" "}
                          {selectedSnapshot.changeType} ·{" "}
                          {formatDateTime(selectedSnapshot.createdAt)}
                        </p>
                      </div>
                      {canWrite &&
                        selectedSnapshot.version !== latestVersion && (
                          <button
                            type="button"
                            onClick={() =>
                              restoreMutation.mutate({
                                id: historyDoc.id,
                                version: selectedSnapshot.version,
                              })
                            }
                            disabled={restoreMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
                          >
                            {restoreMutation.isPending && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Restore this version
                          </button>
                        )}
                    </div>
                    <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-gray-300">
                      {selectedSnapshot.content}
                    </pre>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    Select a version to preview it.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="text-lg font-bold text-white">
              Delete context document?
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {deleteTarget.title || "Untitled"} ({deleteTarget.kind}) will be
              permanently removed from retrieval.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
