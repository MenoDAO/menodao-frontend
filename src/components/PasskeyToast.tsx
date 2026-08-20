"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

export function PasskeyToast({
  toast,
}: {
  toast: { type: "success" | "error"; message: string } | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !toast) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 z-[200] w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl ${
        toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
      }`}
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-start gap-3">
        {toast.type === "success" ? (
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <X className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>,
    document.body,
  );
}
