"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Fingerprint, Loader2, Trash2 } from "lucide-react";
import { PasskeyToast } from "@/components/PasskeyToast";
import {
  browserSupportsWebAuthn,
  clearPasskeyOnThisDevice,
  isAlreadyRegisteredError,
  isThisDeviceRegistered,
  markPasskeyOnThisDevice,
  registerThisDevice,
  thisDeviceCredentialId,
  type PasskeyDevice,
  type PasskeyKind,
} from "@/lib/passkeys";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { useTranslation } from "@/lib/i18n";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PasskeyManager({
  queryKey,
  kind,
  list,
  getOptions,
  verify,
  remove,
  tone = "light",
}: {
  queryKey: string;
  kind: PasskeyKind;
  list: () => Promise<PasskeyDevice[]>;
  getOptions: () => Promise<PublicKeyCredentialCreationOptionsJSON>;
  verify: (
    credential: RegistrationResponseJSON,
    label?: string,
  ) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  tone?: "light" | "dark";
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["passkeys", queryKey],
    queryFn: list,
    enabled: supported,
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const dark = tone === "dark";
  const card = dark
    ? "bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
    : "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden";
  const heading = dark
    ? "text-white"
    : "text-gray-900 dark:text-white";
  const muted = dark
    ? "text-gray-400"
    : "text-gray-600 dark:text-gray-400";
  const divider = dark
    ? "border-gray-700"
    : "border-gray-200 dark:border-gray-700";
  const row = dark
    ? "bg-gray-900/50 border-gray-700"
    : "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700";

  const alreadyAdded = isThisDeviceRegistered(kind, data || []);
  const thisCredId = thisDeviceCredentialId(kind);

  const enroll = async () => {
    if (alreadyAdded) return;
    setBusy(true);
    setError(null);
    try {
      const result = await registerThisDevice(getOptions, verify);
      const credentialId =
        result &&
        typeof result === "object" &&
        "id" in result &&
        typeof result.id === "string"
          ? result.id
          : undefined;
      markPasskeyOnThisDevice(kind, credentialId);
      await queryClient.invalidateQueries({ queryKey: ["passkeys", queryKey] });
      setToast({
        type: "success",
        message: t("profile.signIn.success"),
      });
    } catch (err) {
      if (isAlreadyRegisteredError(err)) {
        markPasskeyOnThisDevice(kind);
        await queryClient.invalidateQueries({ queryKey: ["passkeys", queryKey] });
        setError(null);
        setToast({
          type: "success",
          message: t("profile.signIn.alreadyAdded"),
        });
      } else {
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError") {
          setError(t("profile.signIn.cancelled"));
        } else {
          const message =
            err instanceof Error ? err.message : t("profile.signIn.failed");
          setError(message);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const removeDevice = async (id: string) => {
    const confirmed = window.confirm(t("profile.signIn.removeConfirm"));
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await remove(id);
      const remaining = (data || []).filter((item) => item.id !== id);
      if (remaining.length === 0 || id === thisDeviceCredentialId(kind)) {
        clearPasskeyOnThisDevice(kind);
      }
      await queryClient.invalidateQueries({ queryKey: ["passkeys", queryKey] });
      setToast({ type: "success", message: t("profile.signIn.removed") });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.signIn.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PasskeyToast toast={toast} />

      <section className={card}>
        <div className={`px-6 py-4 border-b ${divider}`}>
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                dark
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              }`}
            >
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`font-semibold ${heading}`}>
                {t("profile.signIn.title")}
              </h2>
              <p className={`mt-1 text-sm ${muted}`}>
                {t("profile.signIn.description")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {!supported ? (
            <p className={`text-sm ${muted}`}>{t("profile.signIn.unsupported")}</p>
          ) : (
            <>
              {alreadyAdded ? (
                <p
                  className={`inline-flex items-center gap-2 text-sm font-medium ${
                    dark
                      ? "text-emerald-300"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {t("profile.signIn.alreadyAdded")}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={enroll}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="h-4 w-4" />
                  )}
                  {data?.length
                    ? t("profile.signIn.addDevice")
                    : t("profile.signIn.enable")}
                </button>
              )}

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              )}

              <div>
                <h3 className={`text-sm font-medium ${heading}`}>
                  {t("profile.signIn.devices")}
                </h3>
                {isLoading ? (
                  <div className={`mt-3 flex items-center gap-2 text-sm ${muted}`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </div>
                ) : (data || []).length === 0 ? (
                  <p className={`mt-2 text-sm ${muted}`}>
                    {t("profile.signIn.empty")}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {data!.map((row) => {
                      const added = formatDate(row.createdAt);
                      const lastUsed = formatDate(row.lastUsedAt);
                      return (
                        <li
                          key={row.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${row}`}
                        >
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${heading}`}>
                              {row.label || t("profile.signIn.thisDevice")}
                              {thisCredId === row.id ? (
                                <span className={`ml-2 text-xs font-normal ${muted}`}>
                                  {t("profile.signIn.thisDevice")}
                                </span>
                              ) : null}
                            </p>
                            <p className={`mt-0.5 text-xs ${muted}`}>
                              {added
                                ? t("profile.signIn.added", { date: added })
                                : t("profile.signIn.thisDevice")}
                              {lastUsed
                                ? ` · ${t("profile.signIn.lastUsed", { date: lastUsed })}`
                                : ` · ${t("profile.signIn.neverUsed")}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDevice(row.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            aria-label={t("profile.signIn.remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("profile.signIn.remove")}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
