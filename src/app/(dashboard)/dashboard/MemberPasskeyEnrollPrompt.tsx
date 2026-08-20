"use client";

import { useEffect, useState } from "react";
import { PasskeyEnrollPrompt } from "@/components/PasskeyEnrollPrompt";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import {
  dashboardLanguageConfirmKey,
  dashboardOnboardingKey,
} from "./dashboard-first-visit-keys";

export default function MemberPasskeyEnrollPrompt() {
  const memberId = useAuthStore((state) => state.member?.id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!memberId) return;

    const firstVisitDone = () => {
      try {
        return Boolean(
          localStorage.getItem(dashboardLanguageConfirmKey(memberId)) &&
            localStorage.getItem(dashboardOnboardingKey(memberId)),
        );
      } catch {
        return true;
      }
    };

    if (firstVisitDone()) {
      setReady(true);
      return;
    }

    const timer = setInterval(() => {
      if (firstVisitDone()) {
        setReady(true);
        clearInterval(timer);
      }
    }, 400);

    return () => clearInterval(timer);
  }, [memberId]);

  return (
    <PasskeyEnrollPrompt
      kind="member"
      enabled={ready}
      getOptions={() => api.webauthnRegisterOptions()}
      verify={(credential, label) =>
        api.webauthnRegisterVerify(credential, label)
      }
    />
  );
}
