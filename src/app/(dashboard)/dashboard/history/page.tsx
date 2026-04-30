"use client";

import { useState, useEffect } from "react";
import { api, MemberHistoryResponse, MemberVisit } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import {
  Calendar,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  Share2,
} from "lucide-react";

export default function MemberHistoryPage() {
  const [history, setHistory] = useState<MemberHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());
  const { t } = useTranslation();

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
    if (newExpanded.has(visitId)) newExpanded.delete(visitId);
    else newExpanded.add(visitId);
    setExpandedVisits(newExpanded);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">{t("history.loadingHistory")}</div>
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
            {t("history.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("history.pageTitle")}
        </h1>
        <p className="text-gray-600 mt-2">{t("history.pageSubtitle")}</p>
      </div>

      {history && history.visits.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t("history.noVisitsTitle")}
          </h2>
          <p className="text-gray-600">{t("history.noVisitsDesc")}</p>
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
          {history.meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                {t("common.previous")}
              </button>
              <span className="text-gray-600">
                {t("common.page", { page, total: history.meta.totalPages })}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(history.meta.totalPages, p + 1))
                }
                disabled={page === history.meta.totalPages}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                {t("common.next")}
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
  const { t } = useTranslation();
  const hasDetails =
    visit.clinicalData?.chiefComplaint ||
    visit.clinicalData?.medicalHistory ||
    visit.clinicalData?.clinicalNotes ||
    visit.questionnaire;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
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
          {t("history.procedures")}
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
        {t("history.treatedBy", { name: visit.treatedBy })}
      </div>

      {/* Impact Proof Badge */}
      {visit.impactProof?.status === "VERIFIED" && (
        <ImpactBadge proof={visit.impactProof} visit={visit} />
      )}

      {/* Expandable Clinical Details */}
      {hasDetails && (
        <div className="mt-4">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {t("history.hideDetails")}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t("history.showDetails")}
              </>
            )}
          </button>

          {isExpanded && (
            <div className="border-t pt-4 mt-4 space-y-4">
              {(visit.clinicalData?.chiefComplaint ||
                visit.clinicalData?.medicalHistory ||
                visit.clinicalData?.clinicalNotes) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t("history.clinicalNotes")}
                  </h4>
                  {visit.clinicalData.chiefComplaint && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">
                        {t("history.chiefComplaint")}
                      </span>{" "}
                      {visit.clinicalData.chiefComplaint}
                    </p>
                  )}
                  {visit.clinicalData.medicalHistory && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">
                        {t("history.medicalHistory")}
                      </span>{" "}
                      {visit.clinicalData.medicalHistory}
                    </p>
                  )}
                  {visit.clinicalData.clinicalNotes && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{t("history.notes")}</span>{" "}
                      {visit.clinicalData.clinicalNotes}
                    </p>
                  )}
                </div>
              )}
              {visit.questionnaire && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t("history.dentalAssessment")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {visit.questionnaire.dmftScore !== null &&
                      visit.questionnaire.dmftScore !== undefined && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                          <p className="text-xs text-blue-600 font-semibold uppercase mb-0.5">
                            {t("history.dmftScore")}
                          </p>
                          <p className="text-lg font-bold text-blue-900">
                            {visit.questionnaire.dmftScore}
                          </p>
                          <p className="text-xs text-blue-500">
                            {t("history.dmftDesc")}
                          </p>
                        </div>
                      )}
                    {visit.questionnaire.lastDentalVisit && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">
                          {t("history.lastDentalVisit")}
                        </p>
                        <p className="text-sm font-medium text-gray-800">
                          {visit.questionnaire.lastDentalVisit}
                        </p>
                      </div>
                    )}
                    {visit.questionnaire.cariesRisk && (
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-2">
                        <p className="text-xs text-orange-600 font-semibold uppercase mb-0.5">
                          {t("history.cariesRisk")}
                        </p>
                        <p className="text-sm font-medium text-orange-900">
                          {visit.questionnaire.cariesRisk}
                        </p>
                      </div>
                    )}
                    {visit.questionnaire.oralHygieneIndex && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                        <p className="text-xs text-green-600 font-semibold uppercase mb-0.5">
                          {t("history.oralHygiene")}
                        </p>
                        <p className="text-sm font-medium text-green-900">
                          {visit.questionnaire.oralHygieneIndex}
                        </p>
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

interface ImpactBadgeProps {
  proof: NonNullable<MemberVisit["impactProof"]>;
  visit: MemberVisit;
}

function ImpactBadge({ proof, visit }: ImpactBadgeProps) {
  const shareText = `🦷 My dental care at ${visit.clinic} was verified on-chain by MenoDAO! Transparent, trustless healthcare powered by Filecoin. #MenoDAO #DeSci #Web3Health`;
  const shareUrl = proof.metadataUrl || `https://app.menodao.org`;

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert("Copied to clipboard!");
  };

  return (
    <div className="mb-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
      {/* Badge header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🏅</span>
        <div>
          <p className="text-sm font-bold text-purple-900">
            Verified Impact Proof
          </p>
          <p className="text-xs text-purple-600">
            Dental care verified on Filecoin Calibration testnet
          </p>
        </div>
        {proof.tokenId && (
          <span className="ml-auto text-xs font-mono text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
            {proof.tokenId.slice(0, 16)}...
          </span>
        )}
      </div>

      {/* Ownership chain */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-white rounded-lg p-2 border border-purple-100">
          <p className="text-xs text-gray-500 mb-0.5">Attester</p>
          <p className="text-xs font-semibold text-gray-800">🏛️ MenoDAO</p>
        </div>
        <div className="bg-white rounded-lg p-2 border border-purple-100">
          <p className="text-xs text-gray-500 mb-0.5">Provider</p>
          <p className="text-xs font-semibold text-gray-800 truncate">
            🦷 {proof.ownership.clinic}
          </p>
        </div>
        <div className="bg-white rounded-lg p-2 border border-purple-100">
          <p className="text-xs text-gray-500 mb-0.5">Beneficiary</p>
          <p className="text-xs font-semibold text-purple-700 truncate">
            ⭐ {proof.ownership.beneficiary}
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 mb-3">
        {proof.metadataUrl && (
          <a
            href={proof.metadataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline bg-white border border-indigo-200 rounded-lg px-2 py-1"
          >
            <ExternalLink className="w-3 h-3" />
            Impact metadata
          </a>
        )}
        {proof.onChainTxHash && (
          <a
            href={`https://calibration.filfox.info/en/message/${proof.onChainTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline bg-white border border-indigo-200 rounded-lg px-2 py-1"
          >
            <ExternalLink className="w-3 h-3" />
            On-chain proof
          </a>
        )}
      </div>

      {/* Share buttons */}
      <div className="border-t border-purple-100 pt-3">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <Share2 className="w-3 h-3" />
          Share your impact
        </p>
        <div className="flex gap-2">
          <button
            onClick={shareTwitter}
            className="flex-1 text-xs py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            𝕏 Twitter
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex-1 text-xs py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="flex-1 text-xs py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
