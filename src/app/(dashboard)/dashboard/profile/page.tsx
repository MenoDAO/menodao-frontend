"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { NFTSection } from "@/components/NFTSection";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import {
  User,
  Phone,
  MapPin,
  Loader2,
  Save,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const member = useAuthStore((state) => state.member);
  const updateMember = useAuthStore((state) => state.updateMember);
  const { t } = useTranslation();

  // County dropdown state
  const [isCountyDropdownOpen, setIsCountyDropdownOpen] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => api.updateProfile(data),
    onSuccess: (updatedMember) => {
      updateMember(updatedMember);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: member?.fullName || "",
      location: member?.location || "",
    },
  });

  const selectedLocation = watch("location");

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

  const handleSelectCounty = (county: string) => {
    setValue("location", county, { shouldDirty: true });
    setIsCountyDropdownOpen(false);
    setCountySearch("");
  };

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">
          {t("profile.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t("common.save")}
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("profile.fullName")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("fullName")}
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("profile.phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={member?.phoneNumber || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Phone number cannot be changed
              </p>
            </div>

            {/* County Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                County
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCountyDropdownOpen(!isCountyDropdownOpen)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-left bg-white dark:bg-gray-700"
                >
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <span
                    className={
                      selectedLocation
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400"
                    }
                  >
                    {selectedLocation || "Select your county"}
                  </span>
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${
                      isCountyDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isCountyDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search field */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-700">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={countySearch}
                          onChange={(e) => setCountySearch(e.target.value)}
                          placeholder="Search county..."
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
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
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-between ${
                              selectedLocation === county
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {county}
                            {selectedLocation === county && (
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
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t("profile.save")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Language Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t("profile.language")}
          </h2>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("profile.languageLabel")}
          </label>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Wallet & NFT Section */}
      <NFTSection />
    </div>
  );
}
