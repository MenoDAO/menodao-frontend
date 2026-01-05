"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, NFT } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import {
  User,
  Phone,
  MapPin,
  Wallet,
  Loader2,
  Save,
  Shield,
  Star,
  Crown,
  ExternalLink,
} from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const tierIcons = {
  BRONZE: Shield,
  SILVER: Star,
  GOLD: Crown,
};

const tierColors = {
  BRONZE: "from-amber-600 to-amber-800",
  SILVER: "from-gray-400 to-gray-600",
  GOLD: "from-yellow-400 to-yellow-600",
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const member = useAuthStore((state) => state.member);
  const updateMember = useAuthStore((state) => state.updateMember);

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
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: member?.fullName || "",
      location: member?.location || "",
    },
  });

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
        <h1 className="text-2xl font-bold text-gray-900 font-outfit">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("fullName")}
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={member?.phoneNumber || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Phone number cannot be changed</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("location")}
                  type="text"
                  placeholder="e.g., Mombasa, Kenya"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Wallet Info */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Blockchain Wallet</h2>
        </div>
        <div className="p-6">
          {profile?.walletAddress ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Wallet className="w-6 h-6 text-emerald-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">Wallet Address</p>
                <p className="font-mono text-gray-900 truncate">{profile.walletAddress}</p>
              </div>
              <a
                href={`https://polygonscan.com/address/${profile.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          ) : (
            <div className="text-center py-6">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                A wallet will be created when you make your first contribution
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NFT Collection */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">My NFT Badges</h2>
        </div>
        <div className="p-6">
          {profile?.nfts && profile.nfts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.nfts.map((nft: NFT) => {
                const TierIcon = tierIcons[nft.tier];
                return (
                  <div
                    key={nft.id}
                    className={`rounded-xl p-4 bg-gradient-to-r ${tierColors[nft.tier]} text-white`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <TierIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{nft.tier} Member NFT</h3>
                        <p className="text-white/70 text-sm">
                          Minted {new Date(nft.mintedAt).toLocaleDateString("en-KE")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <a
                        href={`https://polygonscan.com/tx/${nft.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center gap-1 text-white/80 hover:text-white"
                      >
                        View on PolygonScan
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">
                Subscribe to a package to receive your membership NFT
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
