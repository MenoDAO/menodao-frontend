"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

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

    setIsLoading(true);

    try {
      // Normalize phone number
      const normalizedPhone = phoneNumber.trim().replace(/^0/, "+254");

      // Check if phone number exists
      const { exists } = await api.checkPhoneExists(normalizedPhone);

      if (!exists) {
        // Phone number not found - show error and sign up button
        setError("Phone number not found. Please sign up instead");
        setShowSignUpPrompt(true);
        setIsLoading(false);
        return;
      }

      // Phone exists - send OTP (don't create new member)
      await api.requestOtp(normalizedPhone, false);

      // Navigate to OTP verification with login flow
      router.push(
        `/verify-otp?flow=login&phone=${encodeURIComponent(normalizedPhone)}`,
      );
    } catch (err) {
      console.error("Login error:", err);
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
              Welcome Back
            </h2>
            <p className="text-gray-600 mt-2">
              Enter your phone number to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="0712345678"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

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
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign Up
              </Link>
            </p>
            <div>
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
