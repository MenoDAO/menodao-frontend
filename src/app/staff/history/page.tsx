"use client";

import { useState } from "react";
import { staffApi, PatientHistory } from "@/lib/staff-api";
import { Search, Calendar, DollarSign, Building2 } from "lucide-react";

export default function PatientHistoryPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setError("");
    setHistory(null);

    try {
      // First search for member
      const searchResult = await staffApi.searchMember(phoneNumber);

      if (!searchResult.found || !searchResult.member) {
        setError("Member not found");
        return;
      }

      // Get history
      const historyData = await staffApi.getPatientHistory(
        searchResult.member.id,
      );
      setHistory(historyData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Patient Treatment History
      </h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number (0XXXXXXXXX)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* History Results */}
      {history && (
        <div className="space-y-6">
          {/* Patient Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {history.member.fullName || "Unnamed Patient"}
            </h2>
            <p className="text-gray-600">Phone: {history.member.phoneNumber}</p>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="text-gray-500">Total Visits:</span>
                <span className="ml-2 font-semibold">
                  {history.totalVisits}
                </span>
              </div>
              <div>
                <span className="text-gray-500">This Clinic:</span>
                <span className="ml-2 font-semibold">
                  {history.ownClinicVisits}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Other Clinics:</span>
                <span className="ml-2 font-semibold">
                  {history.otherClinicVisits}
                </span>
              </div>
            </div>
          </div>

          {/* Visits List */}
          <div className="space-y-4">
            {history.visits.map((visit) => (
              <div
                key={visit.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  !visit.isOwnClinic ? "border-l-4 border-orange-400" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(visit.date).toLocaleDateString()} at{" "}
                        {new Date(visit.date).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {visit.clinic}
                        {!visit.isOwnClinic && (
                          <span className="ml-2 text-orange-600 font-semibold">
                            (Other MenoDAO Clinic)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 font-bold">
                      <DollarSign className="w-4 h-4" />
                      <span>KES {visit.totalCost.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {visit.status}
                    </span>
                  </div>
                </div>

                {/* Procedures */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Procedures:
                  </h4>
                  <div className="space-y-1">
                    {visit.procedures.map((proc, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{proc.name}</span>
                        <span className="text-gray-900 font-medium">
                          KES {proc.cost.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Data (only for own clinic) */}
                {visit.clinicalData && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Clinical Notes:
                    </h4>
                    {visit.clinicalData.chiefComplaint && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Chief Complaint:</span>{" "}
                        {visit.clinicalData.chiefComplaint}
                      </p>
                    )}
                    {visit.clinicalData.medicalHistory && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Medical History:</span>{" "}
                        {visit.clinicalData.medicalHistory}
                      </p>
                    )}
                    {visit.clinicalData.clinicalNotes && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span>{" "}
                        {visit.clinicalData.clinicalNotes}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-4">
                  Treated by: {visit.treatedBy}
                </div>
              </div>
            ))}
          </div>

          {history.visits.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                No visit history found for this patient.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
