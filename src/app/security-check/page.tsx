"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { useCaptcha } from "@/hooks/useCaptcha";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { isCaptchaEnabled } from "@/lib/captcha";

export default function SecurityCheckPage() {
  const router = useRouter();
  const { loadUser } = useAuthStore();
  const { captchaToken, setCaptchaToken, clearCaptcha, captchaReady } =
    useCaptcha();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setError(null);

    if (isCaptchaEnabled() && !captchaToken) {
      setError("Please complete the security check");
      return;
    }

    setIsLoading(true);
    try {
      if (captchaToken) {
        const { accessToken } = await api.refreshCaptcha(captchaToken);
        api.setToken(accessToken);
      }
      await loadUser();
      router.replace("/dashboard");
    } catch (err) {
      clearCaptcha();
      setError(
        err instanceof Error ? err.message : "Verification failed. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <Shield className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">
            Security check
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Confirm you are not a bot to continue to your dashboard.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <TurnstileWidget
            onVerify={setCaptchaToken}
            onExpire={clearCaptcha}
            onError={clearCaptcha}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={isLoading || !captchaReady}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying…
            </>
          ) : (
            "Continue to dashboard"
          )}
        </button>
      </div>
    </div>
  );
}
