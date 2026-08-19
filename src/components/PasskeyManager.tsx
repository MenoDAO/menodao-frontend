"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fingerprint, Loader2, Trash2 } from "lucide-react";
import {
  browserSupportsWebAuthn,
  registerThisDevice,
  type PasskeyDevice,
} from "@/lib/passkeys";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export function PasskeyManager({
  queryKey,
  list,
  getOptions,
  verify,
  remove,
  tone = "light",
}: {
  queryKey: string;
  list: () => Promise<PasskeyDevice[]>;
  getOptions: () => Promise<PublicKeyCredentialCreationOptionsJSON>;
  verify: (
    credential: RegistrationResponseJSON,
    label?: string,
  ) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  tone?: "light" | "dark";
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  const { data } = useQuery({
    queryKey: ["passkeys", queryKey],
    queryFn: list,
    enabled: supported,
  });

  const text = tone === "dark" ? "text-gray-300" : "text-gray-600 dark:text-gray-300";
  const btn =
    tone === "dark"
      ? "text-emerald-300 hover:text-emerald-200"
      : "text-blue-600 hover:text-blue-700 dark:text-blue-400";

  if (!supported) return null;

  const enroll = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await registerThisDevice(getOptions, verify);
      await queryClient.invalidateQueries({ queryKey: ["passkeys", queryKey] });
      setMessage("This device can now sign in with fingerprint or Face ID.");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      setMessage(
        name === "NotAllowedError"
          ? "Cancelled."
          : err instanceof Error
            ? err.message
            : "Could not enable device login",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`text-xs ${text}`}>
      <button
        type="button"
        onClick={enroll}
        disabled={busy}
        className={`inline-flex items-center gap-1 font-medium ${btn} disabled:opacity-50`}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Fingerprint className="h-3.5 w-3.5" />}
        {data?.length ? "Add this device" : "Enable fingerprint / Face ID"}
      </button>
      {message && <p className="mt-1">{message}</p>}
      {(data || []).length > 0 && (
        <ul className="mt-2 space-y-1">
          {data!.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2">
              <span>{row.label || "This device"}</span>
              <button
                type="button"
                onClick={async () => {
                  await remove(row.id);
                  await queryClient.invalidateQueries({ queryKey: ["passkeys", queryKey] });
                }}
                className="text-red-500 hover:text-red-400"
                aria-label="Remove device"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
