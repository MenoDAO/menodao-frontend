"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { useCaptcha } from "@/hooks/useCaptcha";
import { staffApi } from "@/lib/staff-api";
import { useStaffStore } from "@/lib/staff-store";
import { isCaptchaEnabled } from "@/lib/captcha";

export default function StaffSecurityCheckPage() {
  const router = useRouter();
  const { setStaff, staff } = useStaffStore();
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
        const { accessToken } = await staffApi.refreshCaptcha(captchaToken);
        staffApi.setToken(accessToken);
        if (staff) {
          setStaff(staff, accessToken);
        }
      }
      router.replace("/staff");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security check
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
            Verify you are not a bot to access patient check-in and treatment
            tools.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <TurnstileWidget
            onVerify={setCaptchaToken}
            onExpire={clearCaptcha}
            onError={clearCaptcha}
            theme="auto"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={isLoading || !captchaReady}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying…
            </>
          ) : (
            "Continue to staff portal"
          )}
        </button>
      </div>
    </div>
  );
}
