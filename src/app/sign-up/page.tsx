"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Phone, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    location: "",
    phoneNumber: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await api.requestOtp(normalizedPhone, true);

      // Navigate to OTP verification with signup flow
      router.push(
        `/verify-otp?flow=signup&phone=${encodeURIComponent(normalizedPhone)}`,
      );
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to MenoDAO
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please provide the details below to continue
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Enter your full name"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    errors.fullName
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Enter your location"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    errors.location
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="e.g., 0712345678"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    errors.phoneNumber
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phoneNumber}
                </p>
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
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                  I accept the{" "}
                  <Link
                    href="/terms"
                    className="text-emerald-600 hover:text-emerald-700 underline"
                    target="_blank"
                  >
                    terms and conditions
                  </Link>{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.acceptedTerms}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          By signing up, you agree to receive SMS notifications for your dental
          care.
        </p>
      </div>
    </div>
  );
}
