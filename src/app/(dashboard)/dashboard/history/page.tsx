"use client";

import { useState, useEffect } from "react";
import { api, MemberHistoryResponse, MemberVisit } from "@/lib/api";
import {
  Calendar,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react";

export default function MemberHistoryPage() {
  const [history, setHistory] = useState<MemberHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await api.getMemberHistory(page, 20);
        setHistory(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [page]);

  const toggleVisit = (visitId: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedVisits(newExpanded);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (history && page < history.meta.totalPages) setPage(page + 1);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading your treatment history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Visits</h1>
        <p className="text-gray-600 mt-2">
          View your complete dental care journey with MenoDAO
        </p>
      </div>

      {history && history.visits.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No visits yet
          </h2>
          <p className="text-gray-600">
            Your visits to MenoDAO clinics will appear here
          </p>
        </div>
      )}

      {history && history.visits.length > 0 && (
        <div className="space-y-4">
          {history.visits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              isExpanded={expandedVisits.has(visit.id)}
              onToggle={() => toggleVisit(visit.id)}
            />
          ))}

          {/* Pagination */}
          {history.meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mt-6">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {page} of {history.meta.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === history.meta.totalPages}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface VisitCardProps {
  visit: MemberVisit;
  isExpanded: boolean;
  onToggle: () => void;
}

function VisitCard({ visit, isExpanded, onToggle }: VisitCardProps) {
  const hasDetails =
    visit.clinicalData?.chiefComplaint ||
    visit.clinicalData?.medicalHistory ||
    visit.clinicalData?.clinicalNotes ||
    visit.questionnaire;

  return (
    <div className="bg-white rounded-lg shadow p-6">
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
            <span className="text-sm text-gray-600">{visit.clinic}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-green-600 font-bold">
            <DollarSign className="w-4 h-4" />
            <span>KES {visit.totalCost.toLocaleString()}</span>
          </div>
          <span className="text-xs text-gray-500">{visit.status}</span>
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

      <div className="text-xs text-gray-500 mb-4">
        Treated by: {visit.treatedBy}
      </div>

      {/* Expandable Details */}
      {hasDetails && (
        <div>
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show clinical details
              </>
            )}
          </button>

          {isExpanded && (
            <div className="border-t pt-4 mt-4 space-y-4">
              {/* Clinical Data */}
              {(visit.clinicalData?.chiefComplaint ||
                visit.clinicalData?.medicalHistory ||
                visit.clinicalData?.clinicalNotes) && (
                <div>
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

              {/* Questionnaire */}
              {visit.questionnaire && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Dental Assessment:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {visit.questionnaire.dmftScore !== null && (
                      <div>
                        <span className="text-gray-500">DMFT Score:</span>
                        <span className="ml-2 font-medium">
                          {visit.questionnaire.dmftScore}
                        </span>
                      </div>
                    )}
                    {visit.questionnaire.lastDentalVisit && (
                      <div>
                        <span className="text-gray-500">Last Visit:</span>
                        <span className="ml-2 font-medium">
                          {visit.questionnaire.lastDentalVisit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
