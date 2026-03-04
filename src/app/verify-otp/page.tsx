"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow") as "signup" | "login" | null;
  const phone = searchParams.get("phone");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { updateMember } = useAuthStore();

  useEffect(() => {
    // Validate that we have required parameters
    if (!flow || !phone) {
      router.push("/login");
    }
  }, [flow, phone, router]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Verify OTP with backend
      const { accessToken, member } = await api.verifyOtp(phone!, otp);
      api.setToken(accessToken);

      // If this is a signup flow, update the account with additional details
      if (flow === "signup") {
        const signupDataStr = sessionStorage.getItem("signup-data");
        if (signupDataStr) {
          const signupData = JSON.parse(signupDataStr);

          // Update member profile with signup data
          const updatedMember = await api.updateProfile({
            fullName: signupData.fullName,
            location: signupData.location,
          });

          updateMember(updatedMember);

          // Clear signup data from session storage
          sessionStorage.removeItem("signup-data");
        } else {
          // No signup data found, just update with member from OTP verification
          updateMember(member);
        }
      } else {
        // Login flow - just update the member state
        updateMember(member);
      }

      // Navigate to dashboard - use window.location for a hard navigation
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("OTP verification error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Invalid OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phone) return;

    setError(null);
    try {
      // Use the same createIfNotExists value based on flow
      const createIfNotExists = flow === "signup";
      await api.requestOtp(phone, createIfNotExists);
      setError("OTP resent successfully");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error("Resend OTP error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to resend OTP";
      setError(errorMessage);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleBackClick = () => {
    if (flow === "signup") {
      router.push("/sign-up");
    } else {
      router.push("/login");
    }
  };

  if (!flow || !phone) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Phone
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We sent a 6-digit code to
            <br />
            <span className="font-semibold text-gray-900 dark:text-white">
              {phone}
            </span>
          </p>
        </div>

        {/* OTP Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center"
              >
                Enter Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-4 text-center text-3xl font-mono tracking-widest rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  error.includes("resent")
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                }`}
              >
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Didn&apos;t receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold text-sm"
            >
              Resend OTP
            </button>
          </div>

          {/* Back Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleBackClick}
              className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {flow === "signup" ? "Sign Up" : "Login"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          The code will expire in 10 minutes
        </p>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
