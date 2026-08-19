"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, Loader2, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import TurnstileWidget from "@/components/TurnstileWidget";
import { useCaptcha } from "@/hooks/useCaptcha";
import { isCaptchaEnabled } from "@/lib/captcha";
import { PasskeyLoginButton } from "@/components/PasskeyLoginButton";
import { hasPasskeyOnThisDevice } from "@/lib/passkeys";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? null;
  const { t } = useTranslation();
  const { loginWithSession } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [showFallback, setShowFallback] = useState(true);
  const { setCaptchaToken, clearCaptcha, requireCaptchaToken, captchaReady, captchaWidgetKey } =
    useCaptcha();

  useEffect(() => {
    const has = hasPasskeyOnThisDevice("member");
    setEnrolled(has);
    setShowFallback(!has);
  }, []);

  const validatePhoneNumber = (phone: string): boolean => {
    // Kenyan phone number validation
    return /^(\+?254|0)?[17]\d{8}$/.test(phone.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSignUpPrompt(false);

    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid Kenyan phone number");
      return;
    }

    if (isCaptchaEnabled() && !captchaReady) {
      setError("Please complete the security check");
      return;
    }

    setIsLoading(true);

    try {
      const captchaToken = requireCaptchaToken();
      // Normalize phone number
      const normalizedPhone = phoneNumber.trim().replace(/^0/, "+254");

      // Check if phone number exists
      const { exists } = await api.checkPhoneExists(normalizedPhone);

      if (!exists) {
        // Phone number not found - show error and sign up button
        setError("Phone number not found. Please sign up instead");
        setShowSignUpPrompt(true);
        clearCaptcha();
        setIsLoading(false);
        return;
      }

      // Phone exists - send OTP (don't create new member)
      await api.requestOtp(normalizedPhone, false, { captchaToken });

      // Navigate to OTP verification with login flow
      const otpUrl = `/verify-otp?flow=login&phone=${encodeURIComponent(normalizedPhone)}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      router.push(otpUrl);
    } catch (err) {
      console.error("Login error:", err);
      clearCaptcha();
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send OTP";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
      setShowSignUpPrompt(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <img src="/logo.png" alt="MenoDAO" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">MenoDAO</h1>
          <p className="text-emerald-200 mt-2">Member Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 font-outfit">
              {t("auth.login.title")}
            </h2>
            <p className="text-gray-600 mt-2">
              {enrolled ? t("auth.login.fingerprint") : t("auth.login.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <PasskeyLoginButton
            kind="member"
            autoStart={enrolled}
            username={phoneNumber}
            label={t("auth.login.fingerprint")}
            getOptions={(name) => api.webauthnLoginOptions(name)}
            verify={(credential) => api.webauthnLoginVerify(credential)}
            onSuccess={(data) => {
              loginWithSession(data.accessToken, data.member);
              const next = callbackUrl || "/dashboard";
              router.push(next);
            }}
            onError={(message) => {
              setError(message);
              setShowFallback(true);
            }}
          />

          {!showFallback && (
            <button
              type="button"
              onClick={() => setShowFallback(true)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              {t("auth.login.usePhoneInstead")}
            </button>
          )}

          {showFallback && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              {t("auth.login.orPhone")}
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("auth.login.phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={t("auth.login.phonePlaceholder")}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                  autoFocus={!enrolled}
                  required
                />
              </div>
            </div>

            <div className="flex justify-center">
              <TurnstileWidget
                key={captchaWidgetKey}
                resetKey={captchaWidgetKey}
                onVerify={setCaptchaToken}
                onExpire={clearCaptcha}
                onError={clearCaptcha}
              />
            </div>

            {/* Sign Up Button (shown when phone not found) */}
            {showSignUpPrompt && (
              <Link href="/sign-up">
                <button
                  type="button"
                  className="w-full py-3 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Sign Up
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading || !captchaReady}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  {t("auth.login.submit")}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <p className="text-sm text-gray-600">
              {t("auth.login.noAccount")}{" "}
              <Link
                href="/sign-up"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {t("auth.login.signUp")}
              </Link>
            </p>
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/register-clinic"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-medium rounded-lg transition-colors"
              >
                Register MenoHub
              </Link>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Link href="/terms" className="hover:text-gray-700 transition-colors">
                  {t("auth.signUp.terms")}
                </Link>
                <span aria-hidden="true">·</span>
                <Link href="/compliance" className="hover:text-gray-700 transition-colors">
                  {t("nav.compliance")}
                </Link>
              </div>
              <a
                href="/staff/login"
                className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Shield className="w-3 h-3" />
                Staff Login
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-emerald-200/60 text-sm mt-8">
          🔒 Secure. Transparent. Community Owned.
        </p>
      </div>
    </div>
  );
}
