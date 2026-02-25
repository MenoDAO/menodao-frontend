"use client";

import { useState, useEffect, useCallback } from "react";
import { OpenVisit, Procedure, staffApi } from "@/lib/staff-api";

interface TreatmentRoomScreenProps {
  visit: OpenVisit;
  onProcedureAdded: () => void;
  onDischarge: () => void;
}

export default function TreatmentRoomScreen({
  visit,
  onProcedureAdded,
  onDischarge,
}: TreatmentRoomScreenProps) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedureId, setSelectedProcedureId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProcedures = useCallback(async () => {
    try {
      const tier = visit.member.subscription?.tier;
      if (tier) {
        const procs = await staffApi.getProceduresForTier(tier);
        setProcedures(procs);
      }
    } catch (err: any) {
      console.error("Failed to load procedures:", err);
    }
  }, [visit.member.subscription?.tier]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  const handleAddProcedure = async () => {
    if (!selectedProcedureId) return;

    setLoading(true);
    setError("");

    try {
      await staffApi.addProcedure(visit.visit.id, selectedProcedureId);
      setSelectedProcedureId("");
      onProcedureAdded();
    } catch (err: any) {
      setError(err.message || "Failed to add procedure");
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case "GOLD":
        return "bg-yellow-500 text-yellow-900";
      case "SILVER":
        return "bg-gray-400 text-gray-900";
      case "BRONZE":
        return "bg-orange-600 text-orange-100";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const totalCost = visit.visit.procedures.reduce(
    (sum, vp) => sum + vp.cost,
    0,
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Treatment Room
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Patient: {visit.member.fullName || visit.member.phoneNumber}
          </p>
        </div>
        {visit.member.subscription?.tier && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierBadgeColor(
              visit.member.subscription.tier,
            )}`}
          >
            {visit.member.subscription.tier}
          </span>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Current Balance
        </p>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          KES {visit.remainingLimit.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Visit Total: KES {totalCost.toLocaleString()} | Allocated: KES{" "}
          {visit.allocatedLimit.toLocaleString()}
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Procedure
        </label>
        <div className="flex gap-4">
          <select
            value={selectedProcedureId}
            onChange={(e) => setSelectedProcedureId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Choose a procedure...</option>
            {procedures.map((proc) => (
              <option key={proc.id} value={proc.id}>
                {proc.name} - KES {proc.cost.toLocaleString()}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddProcedure}
            disabled={!selectedProcedureId || loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Visit"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {visit.visit.procedures.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Procedures Added Today
          </h3>
          <div className="space-y-2">
            {visit.visit.procedures.map((vp) => (
              <div
                key={vp.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {vp.procedure.name}
                  </p>
                  {vp.procedure.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vp.procedure.description}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  KES {vp.cost.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Cost:
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              KES {totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {visit.visit.procedures.length > 0 && (
        <button
          onClick={onDischarge}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          Proceed to Discharge
        </button>
      )}
    </div>
  );
}
