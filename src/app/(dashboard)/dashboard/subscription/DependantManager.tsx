"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { api, Dependant } from "@/lib/api";
import { UserPlus, Users, Loader2 } from "lucide-react";

const TIER_MAX: Record<"SILVER" | "GOLD", number> = { SILVER: 1, GOLD: 2 };

interface DependantManagerProps {
  tier: "SILVER" | "GOLD";
}

export default function DependantManager({ tier }: DependantManagerProps) {
  const { t } = useTranslation();
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // Fetch on mount
  useEffect(() => {
    api
      .getDependants()
      .then((data) => {
        setDependants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameError(t("subscription.dependants.nameRequired"));
      return;
    }
    setNameError(null);
    setApiError(null);
    setSubmitting(true);
    try {
      const created = await api.addDependant({
        fullName: fullName.trim(),
        relationship: "Parent/Child",
      });
      setDependants((prev) => [...prev, created]);
      setNewIds((prev) => new Set(prev).add(created.id));
      setFullName("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add dependant";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const max = TIER_MAX[tier];

  return (
    <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/40 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h2 className="text-white font-semibold">
            {t("subscription.dependants.title")}
          </h2>
        </div>
        <span className="text-sm text-gray-400">
          {t("subscription.dependants.counter", {
            count: dependants.length,
            max,
          })}
        </span>
      </div>

      {/* Dependant list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : dependants.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-2">
          {t("subscription.dependants.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {dependants.map((d) => (
            <li
              key={d.id}
              className={`flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 ${
                newIds.has(d.id) ? "animate-fade-in" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-sm font-bold">
                  {d.fullName[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{d.fullName}</p>
                <p className="text-gray-500 text-xs">{d.relationship}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add form — only if under limit */}
      {dependants.length < max && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 pt-2 border-t border-white/10"
        >
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            {t("subscription.dependants.addTitle")}
          </h3>
          <div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("subscription.dependants.namePlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {nameError && (
              <p className="text-red-400 text-xs mt-1">{nameError}</p>
            )}
          </div>
          <div>
            <select
              value="Parent/Child"
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none cursor-not-allowed opacity-70"
            >
              <option value="Parent/Child">
                {t("subscription.dependants.relationshipOption")}
              </option>
            </select>
          </div>
          {apiError && <p className="text-red-400 text-xs">{apiError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("subscription.dependants.adding")}
              </>
            ) : (
              t("subscription.dependants.addButton")
            )}
          </button>
        </form>
      )}
    </div>
  );
}
