"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, MapPin, Phone, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { KENYAN_COUNTIES } from "@/lib/counties";
import { useTranslation } from "@/lib/i18n";

function SignUpFormInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referredBy, setReferredBy] = useState<string>("");
  const [formData, setFormData] = useState({
    fullName: "",
    location: "",
    phoneNumber: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferredBy(ref);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^(\+?254|0)?[17]\d{8}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Please enter a valid Kenyan phone number";
    }

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize phone number
      const normalizedPhone = formData.phoneNumber.trim().replace(/^0/, "+254");

      // Check if phone number already exists
      const { exists } = await api.checkPhoneExists(normalizedPhone);

      if (exists) {
        // Phone number already exists - show error and login button
        setErrors({
          submit: "Phone number already exists. Please login instead",
        });
        setShowLoginPrompt(true);
        setIsSubmitting(false);
        return;
      }

      // Store signup data in session storage for OTP verification
      sessionStorage.setItem(
        "signup-data",
        JSON.stringify({
          fullName: formData.fullName.trim(),
          location: formData.location.trim(),
          phoneNumber: normalizedPhone,
          acceptedTerms: formData.acceptedTerms,
        }),
      );

      // Send OTP (create member if doesn't exist for signup flow)
      // Pass fullName, location, and referredBy so the member is created with profile data
      await api.requestOtp(normalizedPhone, true, {
        fullName: formData.fullName.trim(),
        location: formData.location.trim(),
        ...(referredBy && { referredBy }),
      });

      // Navigate to OTP verification with signup flow
      router.push(
        `/verify-otp?flow=signup&phone=${encodeURIComponent(normalizedPhone)}`,
      );
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("common.error");
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear login prompt when user changes input
    if (showLoginPrompt) {
      setShowLoginPrompt(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-outfit">
          {t("auth.signUp.title")}
        </h2>
        <p className="text-gray-600 mt-2">{t("auth.signUp.subtitle")}</p>
      </div>

      {/* Referral Banner */}
      {referredBy && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <span>🏆</span>
          <span>
            You were invited by a MenoDAO Champion! Your referral code:{" "}
            <strong>{referredBy}</strong>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("auth.signUp.fullName")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder={t("auth.signUp.fullNamePlaceholder")}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                errors.fullName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-emerald-500"
              }`}
              required
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* County */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("auth.signUp.county")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 outline-none transition-all text-gray-900 appearance-none bg-white ${
                errors.location
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-emerald-500"
              }`}
              required
            >
              <option value="">{t("auth.signUp.countyPlaceholder")}</option>
              {KENYAN_COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
          {errors.location && (
            <p className="mt-1 text-sm text-red-500">{errors.location}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("auth.signUp.phone")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder={t("auth.signUp.phonePlaceholder")}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                errors.phoneNumber
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-emerald-500"
              }`}
              required
            />
          </div>
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={(e) =>
                  handleInputChange("acceptedTerms", e.target.checked)
                }
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              {t("auth.signUp.termsPrefix")}{" "}
              <Link
                href="/terms"
                className="text-emerald-600 hover:text-emerald-700 underline"
                target="_blank"
              >
                {t("auth.signUp.terms")}
              </Link>{" "}
              {t("auth.signUp.and")}{" "}
              <Link
                href="/privacy"
                className="text-emerald-600 hover:text-emerald-700 underline"
                target="_blank"
              >
                {t("auth.signUp.privacy")}
              </Link>{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.acceptedTerms && (
            <p className="mt-1 text-sm text-red-500">{errors.acceptedTerms}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Login Button (shown when phone already exists) */}
        {showLoginPrompt && (
          <Link href="/login">
            <button
              type="button"
              className="w-full py-3 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {t("auth.signUp.login")}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            <>
              {t("auth.signUp.submit")}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          {t("auth.signUp.alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {t("auth.signUp.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpForm() {
  return (
    <Suspense fallback={null}>
      <SignUpFormInner />
    </Suspense>
  );
}
