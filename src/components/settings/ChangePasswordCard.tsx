"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Eye, EyeOff, Loader2, Lock } from "lucide-react";

export function ChangePasswordCard({
  minLength,
  onSubmit,
  tone = "light",
}: {
  minLength: number;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<unknown>;
  tone?: "light" | "dark";
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dark = tone === "dark";
  const card = dark
    ? "bg-gray-800 rounded-xl border border-gray-700 p-6"
    : "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6";
  const heading = dark ? "text-white" : "text-gray-900 dark:text-white";
  const label = dark
    ? "text-gray-300"
    : "text-gray-700 dark:text-gray-300";
  const input = dark
    ? "w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    : "w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const icon = dark ? "text-gray-500" : "text-gray-400";

  const mutation = useMutation({
    mutationFn: () => onSubmit(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to change password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword.length < minLength) {
      setError(`New password must be at least ${minLength} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    mutation.mutate();
  };

  return (
    <section className={card}>
      <h2 className={`text-lg font-semibold mb-1 ${heading}`}>Password</h2>
      <p className={`text-sm mb-4 ${dark ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
        Used as a fallback when this device cannot use fingerprint or Face ID.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`mb-2 block text-sm font-medium ${label}`}>
            Current password
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${icon}`} />
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={input}
              autoComplete="current-password"
            />
          </div>
        </div>
        <div>
          <label className={`mb-2 block text-sm font-medium ${label}`}>
            New password
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${icon}`} />
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`At least ${minLength} characters`}
              className={input}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div>
          <label className={`mb-2 block text-sm font-medium ${label}`}>
            Confirm new password
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${icon}`} />
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={input}
              autoComplete="new-password"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords(!showPasswords)}
          className={`flex items-center gap-2 text-sm ${dark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"}`}
        >
          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPasswords ? "Hide passwords" : "Show passwords"}
        </button>
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}
        {mutation.isSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            Password updated
          </div>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Update password
            </>
          )}
        </button>
      </form>
    </section>
  );
}
