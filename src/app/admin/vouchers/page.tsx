"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  ClipboardCopy,
  Gift,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  Ticket,
  X,
} from "lucide-react";
import {
  adminApi,
  type Voucher,
  type VoucherBatch,
  type VoucherShareChannel,
  type VoucherStats,
  type VoucherStatus,
} from "@/lib/admin-api";

const STATUSES: VoucherStatus[] = ["ISSUED", "REDEEMED", "EXPIRED", "VOID"];

const STATUS_CLASSES: Record<VoucherStatus, string> = {
  ISSUED: "bg-emerald-500/15 text-emerald-400",
  REDEEMED: "bg-sky-500/15 text-sky-400",
  EXPIRED: "bg-amber-500/15 text-amber-400",
  VOID: "bg-red-500/15 text-red-400",
};

const SHARE_CHANNELS: { value: VoucherShareChannel; label: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "X", label: "X" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
];

type Toast = { type: "success" | "error"; message: string };
type GeneratedBatch = { batch: VoucherBatch; vouchers: Voucher[] };

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function StatusBadge({ status }: { status: VoucherStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {status}
    </span>
  );
}

function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-600 px-2.5 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 ${className}`}
      title={`Copy ${label.toLowerCase()}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <ClipboardCopy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Ticket;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between text-gray-400">
        <span className="text-sm font-medium">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value ?? "—"}</p>
    </div>
  );
}

export default function VouchersPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<VoucherStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [count, setCount] = useState("10");
  const [prefix, setPrefix] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedBatch | null>(null);

  const [redeemedBy, setRedeemedBy] = useState("");
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [shareChannel, setShareChannel] =
    useState<VoucherShareChannel>("WHATSAPP");

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
  };

  const stats = useQuery<VoucherStats>({
    queryKey: ["admin", "vouchers", "stats"],
    queryFn: () => adminApi.getVoucherStats(),
  });

  const vouchers = useQuery<Voucher[]>({
    queryKey: ["admin", "vouchers", "list", status, searchTerm],
    queryFn: () =>
      adminApi.listVouchers({
        status: status || undefined,
        search: searchTerm || undefined,
        limit: 200,
      }),
  });

  const detail = useQuery<Voucher>({
    queryKey: ["admin", "vouchers", "detail", selectedId],
    queryFn: () => adminApi.getVoucher(selectedId as string),
    enabled: Boolean(selectedId),
  });

  function updateDetail(voucher: Voucher) {
    queryClient.setQueryData(
      ["admin", "vouchers", "detail", voucher.id],
      voucher,
    );
  }

  const createBatch = useMutation({
    mutationFn: () =>
      adminApi.createVoucherBatch({
        count: Number(count),
        prefix: prefix.trim() || undefined,
        note: note.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    onSuccess: (data) => {
      const rawBatch = (data as any)?.batch ?? (data as any);
      const vouchers = Array.isArray((data as any)?.vouchers)
        ? (data as any).vouchers
        : [];
      const normalized = {
        batch: {
          ...rawBatch,
          total: Number(
            rawBatch?.total ?? rawBatch?.totalInt ?? vouchers.length ?? 0,
          ),
        },
        vouchers: vouchers.map((voucher: any) => ({
          ...voucher,
          sharedChannels: Array.isArray(voucher?.sharedChannels)
            ? voucher.sharedChannels
            : [],
          batch: voucher?.batch
            ? {
                ...voucher.batch,
                total: Number(
                  voucher.batch.total ?? voucher.batch.totalInt ?? 0,
                ),
              }
            : voucher?.batch,
        })),
      };
      setGenerated(normalized);
      setFormError(null);
      setCount("10");
      setNote("");
      setExpiresAt("");
      refresh();
      setToast({
        type: "success",
        message: `${normalized.vouchers.length} voucher codes generated.`,
      });
    },
    onError: (error) =>
      setFormError(errorMessage(error, "Could not generate vouchers.")),
  });

  const redeem = useMutation({
    mutationFn: (id: string) =>
      adminApi.redeemVoucher(id, {
        redeemedBy: redeemedBy.trim() || undefined,
        notes: redemptionNotes.trim() || undefined,
      }),
    onSuccess: (voucher) => {
      updateDetail(voucher);
      setRedeemedBy("");
      setRedemptionNotes("");
      refresh();
      setToast({ type: "success", message: `Voucher ${voucher.code} redeemed.` });
    },
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Could not redeem voucher."),
      }),
  });

  const share = useMutation({
    mutationFn: ({
      id,
      channel,
    }: {
      id: string;
      channel: VoucherShareChannel;
    }) => adminApi.shareVoucher(id, channel),
    onSuccess: (voucher) => {
      updateDetail(voucher);
      refresh();
      setToast({
        type: "success",
        message: `Share via ${shareChannel.toLowerCase()} recorded.`,
      });
    },
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Could not record share."),
      }),
  });

  const voidVoucher = useMutation({
    mutationFn: (id: string) => adminApi.voidVoucher(id),
    onSuccess: (voucher) => {
      updateDetail(voucher);
      refresh();
      setToast({ type: "success", message: `Voucher ${voucher.code} voided.` });
    },
    onError: (error) =>
      setToast({
        type: "error",
        message: errorMessage(error, "Could not void voucher."),
      }),
  });

  function submitBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(count);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5000) {
      setFormError("Enter a whole number of vouchers between 1 and 5,000.");
      return;
    }
    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
      setFormError("Enter a valid expiry date.");
      return;
    }
    setFormError(null);
    createBatch.mutate();
  }

  const openVoucher = (id: string) => {
    setSelectedId(id);
    setRedeemedBy("");
    setRedemptionNotes("");
    setShareChannel("WHATSAPP");
  };

  const selected = detail.data;
  const busy = redeem.isPending || share.isPending || voidVoucher.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Care vouchers — unique codes for access to quality dental care
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-400">
            Generate, track, and redeem voucher codes issued through the
            Foundation network. Only administrators can access this page.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {toast ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-700 bg-emerald-950/60 text-emerald-300"
              : "border-red-700 bg-red-950/60 text-red-300"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <section aria-label="Voucher statistics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={stats.data?.total} icon={Ticket} />
        <StatCard label="Issued" value={stats.data?.issued} icon={Gift} />
        <StatCard label="Redeemed" value={stats.data?.redeemed} icon={Check} />
        <StatCard label="Expired" value={stats.data?.expired} icon={RefreshCw} />
        <StatCard label="Void" value={stats.data?.void} icon={X} />
        <StatCard label="Shared" value={stats.data?.shared} icon={Share2} />
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white">Create a voucher batch</h2>
        <p className="mt-1 text-sm text-gray-400">
          Each code is unique and can be redeemed once. Copy the generated codes
          before leaving this page.
        </p>
        <form
          onSubmit={submitBatch}
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="text-sm text-gray-300">
            Number of vouchers
            <input
              type="number"
              min={1}
              max={5000}
              required
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-gray-300">
            Code prefix <span className="text-gray-500">(optional)</span>
            <input
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              placeholder="e.g. SMILE"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500"
            />
          </label>
          <label className="text-sm text-gray-300">
            Expiry <span className="text-gray-500">(optional)</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-gray-300">
            Note <span className="text-gray-500">(optional)</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Purpose or distribution channel"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={createBatch.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {createBatch.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gift className="h-4 w-4" />
              )}
              {createBatch.isPending ? "Generating…" : "Generate vouchers"}
            </button>
            {formError ? (
              <p className="mt-2 text-sm text-red-400">{formError}</p>
            ) : null}
          </div>
        </form>

        {generated ? (
          <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Generated batch: {generated.batch.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  {generated.vouchers.length} codes
                  {generated.batch.note ? ` · ${generated.batch.note}` : ""}
                </p>
              </div>
              <CopyButton
                value={generated.vouchers.map((voucher) => voucher.code).join("\n")}
                label="Copy all codes"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {generated.vouchers.map((voucher) => (
                <span
                  key={voucher.id}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-gray-800 py-1 pl-2.5 pr-1 font-mono text-xs text-emerald-300"
                >
                  {voucher.code}
                  <CopyButton value={voucher.code} label="" className="border-0 px-1" />
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Voucher register</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as VoucherStatus | "")
              }
              aria-label="Filter by status"
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
            >
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search code or name"
                aria-label="Search vouchers"
                className="w-56 rounded-lg border border-gray-700 bg-gray-900 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-400">
              <tr className="border-b border-gray-700">
                <th className="py-3 pr-4 font-medium">Code</th>
                <th className="py-3 pr-4 font-medium">Batch</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Issued to</th>
                <th className="py-3 pr-4 font-medium">Issued at</th>
                <th className="py-3 pr-4 font-medium">Expires at</th>
                <th className="py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {vouchers.isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Loading vouchers…
                  </td>
                </tr>
              ) : vouchers.isError ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-red-400">
                    {errorMessage(vouchers.error, "Could not load vouchers.")}
                  </td>
                </tr>
              ) : vouchers.data?.length ? (
                vouchers.data.map((voucher) => (
                  <tr
                    key={voucher.id}
                    tabIndex={0}
                    onClick={() => openVoucher(voucher.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openVoucher(voucher.id);
                      }
                    }}
                    className="cursor-pointer text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none"
                  >
                    <td className="py-3 pr-4 font-mono text-emerald-300">
                      {voucher.code}
                    </td>
                    <td className="py-3 pr-4">{voucher.batch?.name ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={voucher.status} />
                    </td>
                    <td className="py-3 pr-4">
                      {voucher.issuedToName || voucher.issuedToPhone || "—"}
                    </td>
                    <td className="py-3 pr-4">{formatDate(voucher.issuedAt)}</td>
                    <td className="py-3 pr-4">{formatDate(voucher.expiresAt)}</td>
                    <td className="py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-500" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No vouchers match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Voucher details"
            className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gray-700 bg-gray-800 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Voucher details
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  {selected ? `#${selected.id}` : "Loading…"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detail.isLoading ? (
              <p className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading voucher…
              </p>
            ) : detail.isError || !selected ? (
              <p className="mt-8 text-sm text-red-400">
                {errorMessage(detail.error, "Could not load voucher details.")}
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-lg text-emerald-300">
                      {selected.code}
                    </span>
                    <CopyButton value={selected.code} />
                  </div>
                  <div className="mt-3">
                    <StatusBadge status={selected.status} />
                  </div>
                  {selected.batch ? (
                    <p className="mt-3 text-xs text-gray-400">
                      Batch: {selected.batch.name} ({selected.batch.codePrefix})
                    </p>
                  ) : null}
                </div>

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Issued to</dt>
                    <dd className="text-right text-gray-200">
                      {selected.issuedToName || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Phone</dt>
                    <dd className="text-right text-gray-200">
                      {selected.issuedToPhone || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Issued at</dt>
                    <dd className="text-right text-gray-200">
                      {formatDate(selected.issuedAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Expires at</dt>
                    <dd className="text-right text-gray-200">
                      {formatDate(selected.expiresAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Redeemed at</dt>
                    <dd className="text-right text-gray-200">
                      {formatDate(selected.redeemedAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Redeemed by</dt>
                    <dd className="text-right text-gray-200">
                      {selected.redeemedByAdminId || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Redemption notes</dt>
                    <dd className="max-w-[60%] break-words text-right text-gray-200">
                      {selected.redemptionNotes || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">Shared via</dt>
                    <dd className="text-right text-gray-200">
                      {(selected.sharedChannels ?? []).length
                        ? (selected.sharedChannels ?? []).join(", ")
                        : "Not shared yet"}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-4 border-t border-gray-700 pt-5">
                  <h3 className="text-sm font-semibold text-white">Actions</h3>

                  <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-900 p-3">
                    <label className="block text-xs text-gray-400">
                      Redeemed by (name or reference)
                      <input
                        value={redeemedBy}
                        onChange={(event) => setRedeemedBy(event.target.value)}
                        placeholder="Optional"
                        disabled={selected.status !== "ISSUED" || busy}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-50"
                      />
                    </label>
                    <label className="block text-xs text-gray-400">
                      Redemption notes
                      <input
                        value={redemptionNotes}
                        onChange={(event) => setRedemptionNotes(event.target.value)}
                        placeholder="Optional"
                        disabled={selected.status !== "ISSUED" || busy}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 disabled:opacity-50"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={selected.status !== "ISSUED" || redeem.isPending || busy}
                      onClick={() => redeem.mutate(selected.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {redeem.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Redeem voucher
                    </button>
                  </div>

                  <div className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-700 bg-gray-900 p-3">
                    <label className="min-w-[160px] flex-1 text-xs text-gray-400">
                      Share channel
                      <select
                        value={shareChannel}
                        onChange={(event) =>
                          setShareChannel(event.target.value as VoucherShareChannel)
                        }
                        disabled={busy}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        {SHARE_CHANNELS.map((channel) => (
                          <option key={channel.value} value={channel.value}>
                            {channel.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={share.isPending || busy}
                      onClick={() =>
                        share.mutate({ id: selected.id, channel: shareChannel })
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {share.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                      Record share
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={selected.status !== "ISSUED" || voidVoucher.isPending || busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Void voucher ${selected.code}? This cannot be undone.`,
                        )
                      ) {
                        voidVoucher.mutate(selected.id);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-700 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Void voucher
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
