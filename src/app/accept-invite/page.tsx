"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function AcceptAdminInvitePage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    if (fromUrl) queueMicrotask(() => setToken(fromUrl));
  }, []);

  const mutation = useMutation({
    mutationFn: () => adminApi.acceptAdminInvite(token.trim(), password),
    onSuccess: () => setDone(true),
    onError: (error: Error) => setError(error.message || "Could not set password"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) return setError("Invite token is required.");
    if (password.length < 8)
      return setError("Use a password of at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    mutation.mutate();
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/20 mb-4">
            {done ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {done ? "Password set" : "Set your admin password"}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {done
              ? "You can now sign in to the admin portal."
              : "Use the one-time invite link provided by a super admin."}
          </p>
        </div>

        {done ? (
          <Link
            href="/admin/login"
            className="block w-full text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
          >
            Go to admin login
          </Link>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
            <label className="block space-y-1 text-sm text-gray-300">
              Invite token
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-xs"
                placeholder="Paste the token from your invite"
              />
            </label>
            <label className="block space-y-1 text-sm text-gray-300">
              New password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                placeholder="At least 8 characters"
              />
            </label>
            <label className="block space-y-1 text-sm text-gray-300">
              Confirm password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              />
            </label>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium inline-flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <KeyRound className="w-4 h-4" /> Set password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
