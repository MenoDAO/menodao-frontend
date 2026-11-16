"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MessagesSquare,
  Search,
  ShieldAlert,
  Trash2,
  UserX,
} from "lucide-react";
import { adminApi, type AdminBotChatThread } from "@/lib/admin-api";
import { useAdminStore } from "@/lib/admin-store";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatWhen(value: string): string {
  const date = new Date(value);
  const now = Date.now();
  const diffMinutes = Math.round((now - date.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)}h ago`;
  return date.toLocaleDateString();
}

function contactLabel(thread: AdminBotChatThread): string {
  if (thread.contactName) return thread.contactName;
  if (/^\d+$/.test(thread.contactId)) return `+${thread.contactId}`;
  return thread.contactId;
}

export default function AdminConversationsPage() {
  const { admin } = useAdminStore();
  const canErase = admin?.role === "SUPER_ADMIN";
  const queryClient = useQueryClient();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState("");
  const [appliedContact, setAppliedContact] = useState("");
  const [instanceFilter, setInstanceFilter] = useState("");
  const [confirmErase, setConfirmErase] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const onError = (err: unknown) =>
    setToast({
      type: "error",
      message: err instanceof Error ? err.message : "Something went wrong",
    });

  const { data: overview } = useQuery({
    queryKey: ["admin", "whatsapp"],
    queryFn: () => adminApi.listWhatsappInstances(),
  });

  const { data: retention } = useQuery({
    queryKey: ["admin", "bot-chat", "retention"],
    queryFn: () => adminApi.botChatRetention(),
  });

  const {
    data: threads,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "bot-chat", "threads", instanceFilter, appliedContact],
    queryFn: () =>
      adminApi.listBotThreads({
        instanceId: instanceFilter || undefined,
        contactId: appliedContact || undefined,
        limit: 100,
      }),
  });

  const selected = useMemo(
    () => (threads ?? []).find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["admin", "bot-chat", "messages", selected?.id],
    queryFn: () => adminApi.listBotThreadMessages(selected!.id, 300),
    enabled: Boolean(selected),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "bot-chat"] });
  };

  const purgeMutation = useMutation({
    mutationFn: () => adminApi.purgeBotChat(),
    onSuccess: (result) => {
      setToast({
        type: "success",
        message: `Purge removed ${result.threads} thread(s) and ${result.messages} message(s).`,
      });
      invalidate();
    },
    onError,
  });

  const eraseMutation = useMutation({
    mutationFn: (memberId: string) => adminApi.eraseBotChatMember(memberId),
    onSuccess: (result) => {
      setConfirmErase(false);
      setSelectedThreadId(null);
      setToast({
        type: "success",
        message: `Erased ${result.threads} thread(s), ${result.messages} message(s), ${result.aiHistoryEntries} AI history entr(ies) and ${result.llmCallLogs} AI log(s).`,
      });
      invalidate();
    },
    onError,
  });

  const exportMutation = useMutation({
    mutationFn: (memberId: string) => adminApi.exportBotChatMember(memberId),
    onSuccess: (payload, memberId) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `bot-conversations-${memberId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setToast({ type: "success", message: "Export downloaded." });
    },
    onError,
  });

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <MessagesSquare className="h-6 w-6 text-emerald-400" />
            Conversations
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            What Dr. Papi and members said to each other, kept for support and
            disputes under the retention policy.
          </p>
        </div>
        {retention && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
              <Clock className="h-3.5 w-3.5" />
              {retention.retentionDays} days after the last message
            </span>
            <button
              type="button"
              onClick={() => purgeMutation.mutate()}
              disabled={!canErase || purgeMutation.isPending}
              title={
                canErase
                  ? "Delete everything whose retention deadline has passed"
                  : "Super admin only"
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-40"
            >
              {purgeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Run purge
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
        <select
          value={instanceFilter}
          onChange={(event) => setInstanceFilter(event.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"
        >
          <option value="">All instances</option>
          {(overview?.instances ?? []).map((instance) => (
            <option key={instance.id} value={instance.id}>
              {instance.label ||
                (instance.phoneNumber ? `+${instance.phoneNumber}` : instance.providerId.slice(0, 8))}
            </option>
          ))}
        </select>
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedContact(contactFilter.replace(/[^\d]/g, ""));
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={contactFilter}
              onChange={(event) => setContactFilter(event.target.value)}
              placeholder="Filter by phone number, e.g. 2547…"
              inputMode="numeric"
              className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
          >
            Filter
          </button>
          {appliedContact && (
            <button
              type="button"
              onClick={() => {
                setAppliedContact("");
                setContactFilter("");
              }}
              className="rounded-lg px-2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error instanceof Error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error.message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Thread list */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {isLoading
              ? "Loading…"
              : `${threads?.length ?? 0} conversation${(threads?.length ?? 0) === 1 ? "" : "s"}`}
          </div>
          <div className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto">
            {!isLoading && (threads?.length ?? 0) === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                Nothing here yet. Conversations appear as soon as a member
                messages the bot.
              </p>
            )}
            {(threads ?? []).map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={`block w-full px-4 py-3 text-left transition hover:bg-white/5 ${
                  selectedThreadId === thread.id ? "bg-emerald-500/10" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-white">
                    {contactLabel(thread)}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-500">
                    {formatWhen(thread.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {thread.messageCount} message
                    {thread.messageCount === 1 ? "" : "s"}
                  </span>
                  <span>·</span>
                  <span>{thread.status.toLowerCase()}</span>
                  {thread.memberId && (
                    <>
                      <span>·</span>
                      <span>member {thread.memberId.slice(0, 8)}</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          {!selected ? (
            <div className="flex h-[70vh] items-center justify-center px-6 text-center text-sm text-gray-500">
              Pick a conversation to read it.
            </div>
          ) : (
            <div className="flex h-[70vh] flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {contactLabel(selected)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {selected.memberId
                      ? `member ${selected.memberId}`
                      : "no linked member"}{" "}
                    · consent {selected.consentBasis ?? "unset"} · kept until{" "}
                    {formatDateTime(selected.retentionUntil)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      selected.memberId &&
                      exportMutation.mutate(selected.memberId)
                    }
                    disabled={!canErase || !selected.memberId || exportMutation.isPending}
                    title={
                      !selected.memberId
                        ? "This thread is not linked to a member, so there is nothing to export by member"
                        : canErase
                          ? "Download every conversation held for this member"
                          : "Super admin only"
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-200 hover:bg-white/10 disabled:opacity-40"
                  >
                    {exportMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmErase(true)}
                    disabled={!canErase || !selected.memberId}
                    title={
                      canErase ? "Erase this member's conversation data" : "Super admin only"
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Erase
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messagesLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
                  </div>
                )}
                {(messages ?? []).map((message) => {
                  const outbound = message.direction === "OUTBOUND";
                  const failed = message.deliveryStatus === "FAILED";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${outbound ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          failed
                            ? "border border-red-500/40 bg-red-500/10 text-red-200"
                            : outbound
                              ? "bg-emerald-500/15 text-emerald-50"
                              : "bg-white/5 text-gray-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`mt-1 flex items-center gap-1.5 text-[10px] ${
                            failed ? "text-red-300/80" : "text-gray-500"
                          }`}
                        >
                          {formatDateTime(message.sentAt)}
                          {message.contentType !== "TEXT" && (
                            <span>· {message.contentType.toLowerCase()}</span>
                          )}
                          {failed && <span>· not delivered</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!messagesLoading && (messages?.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-500">
                    No messages recorded in this thread.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmErase && selected?.memberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0b141a] p-5 shadow-2xl">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Erase this member&apos;s bot data
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Permanently deletes every bot conversation, AI history entry and
              AI call log for member{" "}
              <code className="text-gray-300">{selected.memberId}</code>. This
              cannot be undone. The action is written to the audit log with
              counts, not content.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmErase(false)}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  selected.memberId && eraseMutation.mutate(selected.memberId)
                }
                disabled={eraseMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
              >
                {eraseMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Erase permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
