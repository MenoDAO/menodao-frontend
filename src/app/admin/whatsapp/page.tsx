"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  adminApi,
  type AdminWhatsappInstance,
  type AdminWhatsappOverview,
} from "@/lib/admin-api";
import { useAdminStore } from "@/lib/admin-store";

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; icon: typeof Wifi }
> = {
  CONNECTED: {
    label: "Connected",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Wifi,
  },
  AWAITING_SCAN: {
    label: "Waiting for scan",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: QrCode,
  },
  INITIALIZING: {
    label: "Starting up",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    icon: Loader2,
  },
  DISCONNECTED: {
    label: "Disconnected",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: WifiOff,
  },
  UNKNOWN: {
    label: "Unknown",
    className: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    icon: WifiOff,
  },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.UNKNOWN;
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}
    >
      <Icon
        className={`h-3 w-3 ${status === "INITIALIZING" ? "animate-spin" : ""}`}
      />
      {style.label}
    </span>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "never";
  return new Date(value).toLocaleString();
}

function normalisePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export default function AdminWhatsappPage() {
  const { admin } = useAdminStore();
  const canManage = admin?.role === "SUPER_ADMIN";
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [keyFor, setKeyFor] = useState<AdminWhatsappInstance | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [switchFor, setSwitchFor] = useState<AdminWhatsappInstance | null>(
    null,
  );
  const [switchPhone, setSwitchPhone] = useState("");
  const [confirmDelete, setConfirmDelete] =
    useState<AdminWhatsappInstance | null>(null);

  const { data, isLoading, error } = useQuery<AdminWhatsappOverview>({
    queryKey: ["admin", "whatsapp"],
    queryFn: () => adminApi.listWhatsappInstances(),
    refetchInterval: (query) => {
      const rows = query.state.data?.instances ?? [];
      const pending = rows.some(
        (row) =>
          row.status === "INITIALIZING" || row.status === "AWAITING_SCAN",
      );
      return pending ? 5000 : false;
    },
  });

  const instances = useMemo(() => data?.instances ?? [], [data]);
  const selected =
    instances.find((row) => row.id === selectedId) ??
    instances.find((row) => row.isActive) ??
    instances[0] ??
    null;

  // Prefill the number so the operator sees what will be paired.
  const phoneValue = phoneInput || selected?.phoneNumber || "";

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp"] });
  };

  const onError = (err: unknown) =>
    setToast({
      type: "error",
      message: err instanceof Error ? err.message : "Something went wrong",
    });

  const syncMutation = useMutation({
    mutationFn: () => adminApi.syncWhatsappInstances(),
    onSuccess: (result) => {
      setToast({
        type: "success",
        message: `Imported ${result.instances.length} instance${result.instances.length === 1 ? "" : "s"} from FlareSend.`,
      });
      refresh();
    },
    onError,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createWhatsappInstance({
        label: newLabel.trim() || undefined,
      }),
    onSuccess: (instance) => {
      setToast({
        type: "success",
        message: `Instance created (${instance.providerId.slice(0, 8)}). Link a number below.`,
      });
      setShowCreate(false);
      setNewLabel("");
      setSelectedId(instance.id);
      refresh();
    },
    onError,
  });

  const pairingMutation = useMutation({
    mutationFn: async (input: {
      instance: AdminWhatsappInstance;
      phone: string;
    }) => {
      await adminApi
        .reconnectWhatsappInstance(input.instance.id)
        .catch(() => undefined);
      const result = await adminApi.whatsappPairingCode(
        input.instance.id,
        normalisePhone(input.phone) || undefined,
      );
      return result;
    },
    onSuccess: (result) => {
      setQrPayload(null);
      setPairingCode(result.pairingCode);
      if (!result.pairingCode) {
        setToast({
          type: "error",
          message:
            "FlareSend accepted the request but returned no code. Try the QR instead.",
        });
      }
      refresh();
    },
    onError,
  });

  const qrMutation = useMutation({
    mutationFn: async (instance: AdminWhatsappInstance) => {
      await adminApi
        .reconnectWhatsappInstance(instance.id)
        .catch(() => undefined);
      return adminApi.whatsappQr(instance.id);
    },
    onSuccess: (result) => {
      setPairingCode(null);
      setQrPayload(result.qr);
      if (!result.qr) {
        setToast({
          type: "error",
          message:
            "No QR is available yet. Give FlareSend a few seconds, then try again.",
        });
      }
      refresh();
    },
    onError,
  });

  const relinkMutation = useMutation({
    mutationFn: (instance: AdminWhatsappInstance) =>
      adminApi.relinkWhatsappInstance(
        instance.id,
        normalisePhone(switchPhone),
      ),
    onSuccess: (result) => {
      setSwitchFor(null);
      setSwitchPhone("");
      setPairingCode(result.pairingCode);
      setQrPayload(null);
      setToast({
        type: "success",
        message: `Session reset. Pair ${result.phoneNumber} with the code below.`,
      });
      refresh();
    },
    onError,
  });

  const activateMutation = useMutation({
    mutationFn: (instance: AdminWhatsappInstance) =>
      adminApi.activateWhatsappInstance(instance.id),
    onSuccess: () => {
      setToast({ type: "success", message: "Bot sender switched." });
      refresh();
    },
    onError,
  });

  const reconnectMutation = useMutation({
    mutationFn: (instance: AdminWhatsappInstance) =>
      adminApi.reconnectWhatsappInstance(instance.id),
    onSuccess: () => {
      setToast({ type: "success", message: "Reconnect requested." });
      refresh();
    },
    onError,
  });

  const storeKeyMutation = useMutation({
    mutationFn: (instance: AdminWhatsappInstance) =>
      adminApi.storeWhatsappInstanceKey(instance.id, keyInput.trim()),
    onSuccess: (instance) => {
      setKeyFor(null);
      setKeyInput("");
      setToast({
        type: "success",
        message: `Key stored (${instance.keyFingerprint ?? "fingerprint unavailable"}).`,
      });
      refresh();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (instance: AdminWhatsappInstance) =>
      adminApi.deleteWhatsappInstance(instance.id),
    onSuccess: () => {
      setConfirmDelete(null);
      setToast({ type: "success", message: "Instance deleted." });
      refresh();
    },
    onError,
  });

  const copyWebhook = async () => {
    if (!data?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(data.webhookUrl);
      setToast({ type: "success", message: "Webhook URL copied." });
    } catch {
      setToast({ type: "error", message: "Copy failed. Select it manually." });
    }
  };

  const pendingAction =
    pairingMutation.isPending ||
    qrMutation.isPending ||
    relinkMutation.isPending ||
    activateMutation.isPending ||
    reconnectMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading WhatsApp instances…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <MessageCircle className="h-6 w-6 text-emerald-400" />
            WhatsApp
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Link the number Dr. Papi answers from, switch numbers, and see which
            instances are ready to send.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data?.plan.name && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
              Plan <strong className="text-white">{data.plan.name}</strong>
              {data.plan.maxInstances !== null && (
                <>
                  {" · "}
                  {data.slotsUsed}/{data.plan.maxInstances} instances
                </>
              )}
            </span>
          )}
          {data?.plan.endsAt && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">
              Renews {new Date(data.plan.endsAt).toLocaleDateString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !canManage}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync from FlareSend
          </button>
        </div>
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

      {error instanceof Error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error.message}
        </div>
      )}

      {!canManage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          You can see the instance state, but linking, switching numbers and
          deleting need a super admin.
        </div>
      )}

      {/* Webhook */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Inbound webhook
        </h2>
        {data?.webhookUrl ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-emerald-300">
                {data.webhookUrl}
              </code>
              <button
                type="button"
                onClick={copyWebhook}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              {data.webhookNote}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-amber-300">
            <code>FLARESEND_WEBHOOK_PATH_TOKEN</code> is not configured for this
            environment, so there is no URL to paste into FlareSend.
          </p>
        )}
      </section>

      {/* Link / status */}
      {selected ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                  {selected.label || "WhatsApp instance"}
                </h2>
                <StatusBadge status={selected.status} />
                {selected.isActive && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    Sending
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5" />
                  {selected.phoneNumber
                    ? `+${selected.phoneNumber}`
                    : "no number linked"}
                </span>
                <span>id {selected.providerId.slice(0, 8)}…</span>
                <span>checked {formatDate(selected.lastCheckedAt)}</span>
                <span>
                  key{" "}
                  {selected.hasStoredKey
                    ? selected.keyFingerprint
                    : "from environment"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => reconnectMutation.mutate(selected)}
                disabled={!canManage || pendingAction}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> Reconnect
              </button>
              {!selected.isActive && (
                <button
                  type="button"
                  onClick={() => activateMutation.mutate(selected)}
                  disabled={!canManage || pendingAction}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" /> Use for sending
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-white">
                Link with a pairing code
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Type this code on the phone: WhatsApp → Linked devices → Link
                with phone number. No camera needed.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={phoneValue}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  placeholder={selected.phoneNumber ?? "254713278107"}
                  inputMode="numeric"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    pairingMutation.mutate({ instance: selected, phone: phoneValue })
                  }
                  disabled={!canManage || pendingAction}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {pairingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Get code
                </button>
              </div>
              {pairingCode && (
                <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-emerald-300/80">
                    Pairing code
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold tracking-[0.35em] text-emerald-300">
                    {pairingCode}
                  </p>
                  <p className="mt-2 text-xs text-emerald-200/70">
                    Expires quickly. If it fails, request a new one.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-white">Scan a QR</h3>
              <p className="mt-1 text-xs text-gray-400">
                WhatsApp → Linked devices → Link a device, then scan this.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => qrMutation.mutate(selected)}
                  disabled={!canManage || pendingAction}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
                >
                  {qrMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  Show QR
                </button>
                {qrPayload && (
                  <div className="rounded-lg bg-white p-2">
                    <QRCodeSVG value={qrPayload} size={140} includeMargin />
                  </div>
                )}
              </div>
              {qrPayload && (
                <p className="mt-2 text-xs text-gray-400">
                  The code rotates. Generate a new one if it stops working.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-sm text-gray-300">
            No instance is tracked yet. Sync from FlareSend to import the one on
            your account.
          </p>
          {data?.slotsRemaining !== 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              disabled={!canManage}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> New instance
            </button>
          )}
        </section>
      )}

      {/* Instances table */}
      {instances.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              All instances
            </h2>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              disabled={!canManage || data?.slotsRemaining === 0}
              title={
                data?.slotsRemaining === 0
                  ? "The plan has no free slot. Relink the existing instance instead."
                  : undefined
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Add instance
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {instances.map((row) => (
              <div
                key={row.id}
                className={`flex flex-wrap items-center gap-3 px-5 py-4 ${
                  selected?.id === row.id ? "bg-white/[0.03]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(row.id);
                    setPairingCode(null);
                    setQrPayload(null);
                    setPhoneInput(row.phoneNumber ?? "");
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {row.label || row.phoneNumber || row.providerId.slice(0, 8)}
                    </span>
                    <StatusBadge status={row.status} />
                    {row.isActive && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                        sending
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {row.phoneNumber ? `+${row.phoneNumber}` : "no number"} ·
                    id {row.providerId.slice(0, 8)}… · key{" "}
                    {row.hasStoredKey
                      ? row.keyFingerprint
                      : "environment"}
                  </p>
                </button>
                <div className="flex flex-wrap items-center gap-1.5">
                  {!row.isActive && (
                    <button
                      type="button"
                      onClick={() => activateMutation.mutate(row)}
                      disabled={!canManage || pendingAction}
                      className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      Use
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchFor(row);
                      setSwitchPhone("");
                    }}
                    disabled={!canManage || pendingAction}
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-200 hover:bg-white/10 disabled:opacity-40"
                  >
                    Switch number
                  </button>
                  {!row.hasStoredKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setKeyFor(row);
                        setKeyInput("");
                      }}
                      disabled={!canManage}
                      className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      Store key
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(row)}
                    disabled={!canManage}
                    className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal
          title="New WhatsApp instance"
          onClose={() => setShowCreate(false)}
        >
          <p className="text-sm text-gray-400">
            FlareSend creates the instance and returns a key, which is stored
            encrypted here. You still have to link a number afterwards.
          </p>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Label
          </label>
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Clinic main line"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create
            </button>
          </div>
        </Modal>
      )}

      {/* Switch number modal */}
      {switchFor && (
        <Modal
          title="Switch to another number"
          onClose={() => setSwitchFor(null)}
        >
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            This drops the current WhatsApp session on{" "}
            {switchFor.phoneNumber ? `+${switchFor.phoneNumber}` : "this instance"}
            . That number stops receiving replies. The instance and its key are
            kept.
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            New number
          </label>
          <input
            value={switchPhone}
            onChange={(event) => setSwitchPhone(event.target.value)}
            placeholder="254713278107"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:outline-none"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSwitchFor(null)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => relinkMutation.mutate(switchFor)}
              disabled={
                relinkMutation.isPending || normalisePhone(switchPhone).length < 8
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
            >
              {relinkMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Switch and get code
            </button>
          </div>
        </Modal>
      )}

      {/* Store key modal */}
      {keyFor && (
        <Modal title="Store instance key" onClose={() => setKeyFor(null)}>
          <p className="text-sm text-gray-400">
            Copy the instance key from the FlareSend dashboard. It is encrypted
            before it is stored and never shown again.
          </p>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Instance key
          </label>
          <input
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            type="password"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500/50 focus:outline-none"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setKeyFor(null)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => storeKeyMutation.mutate(keyFor)}
              disabled={
                storeKeyMutation.isPending || keyInput.trim().length < 16
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {storeKeyMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Store key
            </button>
          </div>
        </Modal>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <Modal title="Delete instance" onClose={() => setConfirmDelete(null)}>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            This deletes the instance on FlareSend and locally. Conversations
            already archived are kept until their retention deadline.
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(confirmDelete)}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0b141a] p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
