"use client";

import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { completePasskeyLogin } from "@/lib/passkeys";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export function PasskeyLoginButton<T>({
  getOptions,
  verify,
  username,
  onSuccess,
  onError,
  label = "Use fingerprint or Face ID",
  className,
}: {
  getOptions: (
    username?: string,
  ) => Promise<PublicKeyCredentialRequestOptionsJSON>;
  verify: (credential: AuthenticationResponseJSON) => Promise<T>;
  username?: string;
  onSuccess: (result: T) => void;
  onError: (message: string) => void;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const result = await completePasskeyLogin(getOptions, verify, username);
      onSuccess(result);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        onError("Device login was cancelled.");
      } else {
        onError(err instanceof Error ? err.message : "Device login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className={
        className ||
        "w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
      {loading ? "Waiting for device…" : label}
    </button>
  );
}
