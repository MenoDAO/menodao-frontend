"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Fingerprint, Loader2, X } from "lucide-react";
import {
  isAlreadyRegisteredError,
  markPasskeyOnThisDevice,
  registerThisDevice,
  shouldOfferPasskeyEnroll,
  skipPasskeyEnrollPrompt,
  type PasskeyKind,
} from "@/lib/passkeys";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { useTranslation } from "@/lib/i18n";
import { PasskeyToast } from "@/components/PasskeyToast";

export function PasskeyEnrollPrompt({
  kind,
  getOptions,
  verify,
  enabled = true,
  tone = "light",
}: {
  kind: PasskeyKind;
  getOptions: () => Promise<PublicKeyCredentialCreationOptionsJSON>;
  verify: (
    credential: RegistrationResponseJSON,
    label?: string,
  ) => Promise<unknown>;
  enabled?: boolean;
  tone?: "light" | "dark";
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled || !shouldOfferPasskeyEnroll(kind)) return;
    const timer = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(timer);
  }, [enabled, kind]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const close = () => {
    skipPasskeyEnrollPrompt(kind);
    setOpen(false);
  };

  const enroll = async () => {
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
      skipPasskeyEnrollPrompt(kind);
      setOpen(false);
      setToast({ type: "success", message: t("profile.signIn.success") });
    } catch (err) {
      if (isAlreadyRegisteredError(err)) {
        markPasskeyOnThisDevice(kind);
        skipPasskeyEnrollPrompt(kind);
        setOpen(false);
        setToast({
          type: "success",
          message: t("profile.signIn.alreadyAdded"),
        });
      } else {
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError") {
          setError(t("profile.signIn.cancelled"));
        } else {
          setError(
            err instanceof Error ? err.message : t("profile.signIn.failed"),
          );
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const dark = tone === "dark";
  const sheet = dark
    ? "bg-gray-800 text-white border-gray-700"
    : "bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700";
  const muted = dark ? "text-gray-400" : "text-gray-600 dark:text-gray-400";

  if (!mounted) return <PasskeyToast toast={toast} />;

  return (
    <>
      <PasskeyToast toast={toast} />
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[180] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="passkey-enroll-title"
          >
            <div
              className={`w-full max-w-md rounded-t-2xl border p-6 shadow-2xl sm:rounded-2xl ${sheet}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      dark
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
                  >
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      id="passkey-enroll-title"
                      className="text-lg font-semibold"
                    >
                      {t("profile.signIn.promptTitle")}
                    </h2>
                    <p className={`mt-1 text-sm ${muted}`}>
                      {t("profile.signIn.promptBody")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className={`rounded-md p-1 ${muted} hover:opacity-80`}
                  aria-label={t("common.close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={close}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
                    dark
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {t("profile.signIn.promptLater")}
                </button>
                <button
                  type="button"
                  onClick={() => void enroll()}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="h-4 w-4" />
                  )}
                  {t("profile.signIn.promptEnable")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
