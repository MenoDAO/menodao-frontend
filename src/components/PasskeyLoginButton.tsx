"use client";

import { useEffect, useRef, useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import {
  completePasskeyLogin,
  shouldAutoStartPasskey,
  browserSupportsWebAuthn,
  markPasskeyOnThisDevice,
  type PasskeyKind,
} from "@/lib/passkeys";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export function PasskeyLoginButton<T>({
  getOptions,
  verify,
  username,
  kind,
  autoStart = false,
  onSuccess,
  onError,
  label = "Continue with fingerprint or Face ID",
  className,
}: {
  getOptions: (
    username?: string,
  ) => Promise<PublicKeyCredentialRequestOptionsJSON>;
  verify: (credential: AuthenticationResponseJSON) => Promise<T>;
  username?: string;
  kind: PasskeyKind;
  autoStart?: boolean;
  onSuccess: (result: T) => void;
  onError: (message: string) => void;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const running = useRef(false);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  const run = async (name?: string) => {
    if (running.current) return;
    running.current = true;
    setLoading(true);
    try {
      const result = await completePasskeyLogin(
        getOptions,
        verify,
        name?.trim() || undefined,
      );
      markPasskeyOnThisDevice(kind);
      onSuccess(result);
    } catch (err) {
      const errorName = err instanceof Error ? err.name : "";
      if (errorName === "NotAllowedError") {
        onError("Device login was cancelled. You can use your credentials instead.");
      } else {
        onError(err instanceof Error ? err.message : "Device login failed");
      }
    } finally {
      running.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoStart) return;
    if (!shouldAutoStartPasskey(kind)) return;
    void run(username);
    // Auto-start once on mount for enrolled devices.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, kind]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => void run(username)}
      disabled={loading}
      className={
        className ||
        "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
      {loading ? "Waiting for device…" : label}
    </button>
  );
}
