"use client";

import { useState, useCallback } from "react";
import { isCaptchaEnabled } from "@/lib/captcha";

export function useCaptcha() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaWidgetKey, setCaptchaWidgetKey] = useState(0);

  const clearCaptcha = useCallback(() => {
    setCaptchaToken(null);
    // Turnstile tokens are single-use; remount to issue a fresh challenge.
    setCaptchaWidgetKey((key) => key + 1);
  }, []);

  const requireCaptchaToken = useCallback((): string | undefined => {
    if (!isCaptchaEnabled()) {
      return undefined;
    }
    if (!captchaToken) {
      throw new Error("Please complete the security check");
    }
    return captchaToken;
  }, [captchaToken]);

  return {
    captchaToken,
    captchaWidgetKey,
    setCaptchaToken,
    clearCaptcha,
    requireCaptchaToken,
    captchaReady: !isCaptchaEnabled() || !!captchaToken,
  };
}
