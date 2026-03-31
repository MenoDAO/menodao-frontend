"use client";

import { useState, useEffect, useCallback } from "react";
import { OpenVisit, Procedure, staffApi } from "@/lib/staff-api";
import { getTierBadgeColor, getTierDisplayName } from "@/lib/tier-utils";
import Web3CaseUpload from "./Web3CaseUpload";

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

  const hasMember = visit?.member;
  const hasSubscription = visit?.member?.subscription;

  const loadProcedures = useCallback(async () => {
    if (!hasSubscription) return;

    try {
      const tier = visit.member.subscription?.tier;
      if (tier) {
        const procs = await staffApi.getProceduresForTier(tier);
        setProcedures(procs);
      }
    } catch (err) {
      console.error("Failed to load procedures:", err);
    }
  }, [visit?.member?.subscription?.tier, hasSubscription]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  // Safety checks after hooks
  if (!hasMember) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600 font-semibold mb-4">
          Error: Member data not available
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600 font-semibold mb-4">
          Error: Member subscription data not available
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  const handleAddProcedure = async () => {
    if (!selectedProcedureId) return;

    setLoading(true);
    setError("");

    try {
      await staffApi.addProcedure(visit.visit.id, selectedProcedureId);
      setSelectedProcedureId("");
      onProcedureAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add procedure");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = visit.visit.procedures.reduce(
    (sum, vp) => sum + vp.cost,
    0,
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treatment Room</h2>
          <p className="text-sm text-gray-600 mt-1">
            Patient: {visit.member.fullName || visit.member.phoneNumber}
          </p>
        </div>
        {visit.member.subscription?.tier && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierBadgeColor(
              visit.member.subscription.tier,
            )}`}
          >
            {getTierDisplayName(visit.member.subscription.tier)}
          </span>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600 mb-1">Current Balance</p>
        <p className="text-3xl font-bold text-blue-600">
          KES {visit.remainingLimit.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Visit Total: KES {totalCost.toLocaleString()} | Allocated: KES{" "}
          {visit.allocatedLimit.toLocaleString()}
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Procedure
        </label>
        <div className="flex gap-4">
          <select
            value={selectedProcedureId}
            onChange={(e) => setSelectedProcedureId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {visit.visit.procedures.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Procedures Added Today
          </h3>
          <div className="space-y-2">
            {visit.visit.procedures.map((vp) => (
              <div
                key={vp.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {vp.procedure.name}
                  </p>
                  {vp.procedure.description && (
                    <p className="text-sm text-gray-600">
                      {vp.procedure.description}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900">
                  KES {vp.cost.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Total Cost:
            </span>
            <span className="text-xl font-bold text-gray-900">
              KES {totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {visit.visit.procedures.length > 0 && (
        <>
          <Web3CaseUpload visitId={visit.visit.id} />
          <button
            onClick={onDischarge}
            className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Proceed to Discharge
          </button>
        </>
      )}
    </div>
  );
}
