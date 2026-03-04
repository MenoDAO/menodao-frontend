"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import {
  Phone,
  Shield,
  ArrowRight,
  Loader2,
  User,
  MapPin,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^(\+?254|0)\d{8,9}$/, "Please enter a valid Kenyan phone number"),
});

const otpSchema = z.object({
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { requestOtp, verifyOtp, otpSent, phoneNumber, updateMember } =
    useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileLocation, setProfileLocation] = useState("");

  // County dropdown state
  const [isCountyDropdownOpen, setIsCountyDropdownOpen] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCounties = KENYA_COUNTIES.filter((county) =>
    county.toLowerCase().includes(countySearch.toLowerCase()),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsCountyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isCountyDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isCountyDropdownOpen]);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const handleRequestOtp = async (data: PhoneFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await requestOtp(data.phoneNumber);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send OTP";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await verifyOtp(data.code);
      // Check if user has a profile (fullName)
      const member = useAuthStore.getState().member;
      if (!member?.fullName) {
        setShowProfileSetup(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Invalid OTP";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!profileName.trim()) return;
    setIsLoading(true);
    try {
      const updated = await api.updateProfile({
        fullName: profileName.trim(),
        location: profileLocation.trim() || undefined,
      });
      updateMember(updated);
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipProfile = () => {
    router.push("/dashboard");
  };

  const handleSelectCounty = (county: string) => {
    setProfileLocation(county);
    setIsCountyDropdownOpen(false);
    setCountySearch("");
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

        {/* Profile Setup Card */}
        {showProfileSetup ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 font-outfit">
                Complete Your Profile
              </h2>
              <p className="text-gray-600 mt-2">
                Tell us a bit about yourself to personalize your experience
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Jane Wanjiku"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* County Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setIsCountyDropdownOpen(!isCountyDropdownOpen)
                    }
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-left bg-white"
                  >
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <span
                      className={
                        profileLocation ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {profileLocation || "Select your county"}
                    </span>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${
                        isCountyDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isCountyDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                      {/* Search field */}
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={countySearch}
                            onChange={(e) => setCountySearch(e.target.value)}
                            placeholder="Search county..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 placeholder-gray-400"
                          />
                        </div>
                      </div>
                      {/* County list */}
                      <div className="overflow-y-auto max-h-48">
                        {filteredCounties.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No counties found
                          </div>
                        ) : (
                          filteredCounties.map((county) => (
                            <button
                              key={county}
                              type="button"
                              onClick={() => handleSelectCounty(county)}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                                profileLocation === county
                                  ? "bg-emerald-50 text-emerald-700 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {county}
                              {profileLocation === county && (
                                <Check className="w-4 h-4 text-emerald-600" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleProfileSubmit}
                disabled={isLoading || !profileName.trim()}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipProfile}
                className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          /* Login Card */
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-outfit">
                {otpSent ? "Enter Verification Code" : "Welcome to MenoDAO"}
              </h2>
              <p className="text-gray-600 mt-2">
                {otpSent
                  ? `We sent a code to ${phoneNumber}`
                  : "Sign in or create your account"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {!otpSent ? (
              <form
                onSubmit={phoneForm.handleSubmit(handleRequestOtp)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...phoneForm.register("phoneNumber")}
                      type="tel"
                      placeholder="0712345678"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  {phoneForm.formState.errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {phoneForm.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form
                onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...otpForm.register("code")}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-center text-2xl tracking-widest font-mono text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  {otpForm.formState.errors.code && (
                    <p className="mt-1 text-sm text-red-600">
                      {otpForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => useAuthStore.setState({ otpSent: false })}
                  className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm"
                >
                  Use different number
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <a
                  href="https://menodao.org"
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Join MenoDAO
                </a>
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
        )}

        <p className="text-center text-emerald-200/60 text-sm mt-8">
          🔒 Secure. Transparent. Community Owned.
        </p>
      </div>
    </div>
  );
}
