"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStaffStore } from "@/lib/staff-store";
import { staffApi } from "@/lib/staff-api";
import TurnstileWidget from "@/components/TurnstileWidget";
import { useCaptcha } from "@/hooks/useCaptcha";
import { isCaptchaEnabled } from "@/lib/captcha";
import { PasskeyLoginButton } from "@/components/PasskeyLoginButton";
import { hasPasskeyOnThisDevice } from "@/lib/passkeys";

export default function StaffLoginPage() {
  const router = useRouter();
  const { setStaff } = useStaffStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [showFallback, setShowFallback] = useState(true);
  const {
    setCaptchaToken,
    clearCaptcha,
    requireCaptchaToken,
    captchaReady,
    captchaWidgetKey,
  } = useCaptcha();

  useEffect(() => {
    const has = hasPasskeyOnThisDevice("staff");
    setEnrolled(has);
    setShowFallback(!has);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isCaptchaEnabled() && !captchaReady) {
      setError("Please complete the security check");
      return;
    }

    setLoading(true);

    try {
      const captchaToken = requireCaptchaToken();
      const response = await staffApi.login(username, password, captchaToken);
      staffApi.setToken(response.accessToken);
      setStaff(response.staff, response.accessToken);
      router.push("/staff");
    } catch (err: unknown) {
      clearCaptcha();
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Staff Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {enrolled
              ? "Use this device to sign in"
              : "Sign in to access the clinic dashboard"}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {enrolled && (
          <PasskeyLoginButton
            kind="staff"
            autoStart={enrolled}
            username={username}
            getOptions={(name) => staffApi.webauthnLoginOptions(name)}
            verify={(credential) => staffApi.webauthnLoginVerify(credential)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            onSuccess={(response) => {
              staffApi.setToken(response.accessToken);
              setStaff(response.staff, response.accessToken);
              router.push("/staff");
            }}
            onError={(message) => {
              setError(message);
              setShowFallback(true);
            }}
          />
        )}

        {!showFallback && (
          <button
            type="button"
            onClick={() => setShowFallback(true)}
            className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Use username and password instead
          </button>
        )}

        {showFallback && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              or use password
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  autoComplete="username webauthn"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex justify-center">
                <TurnstileWidget
                  key={captchaWidgetKey}
                  resetKey={captchaWidgetKey}
                  onVerify={setCaptchaToken}
                  onExpire={clearCaptcha}
                  onError={clearCaptcha}
                  theme="auto"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !captchaReady}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in with password"}
              </button>
            </form>
          </>
        )}

        {!enrolled && (
          <PasskeyLoginButton
            kind="staff"
            autoStart={false}
            username={username}
            getOptions={(name) => staffApi.webauthnLoginOptions(name)}
            verify={(credential) => staffApi.webauthnLoginVerify(credential)}
            className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center justify-center gap-2 py-2"
            onSuccess={(response) => {
              staffApi.setToken(response.accessToken);
              setStaff(response.staff, response.accessToken);
              router.push("/staff");
            }}
            onError={(message) => setError(message)}
          />
        )}
      </div>
    </div>
  );
}
