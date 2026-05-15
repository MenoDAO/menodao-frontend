"use client";

import { useState, useCallback } from "react";
import { isCaptchaEnabled } from "@/lib/captcha";

export function useCaptcha() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const clearCaptcha = useCallback(() => setCaptchaToken(null), []);

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
    setCaptchaToken,
    clearCaptcha,
    requireCaptchaToken,
    captchaReady: !isCaptchaEnabled() || !!captchaToken,
  };
}
