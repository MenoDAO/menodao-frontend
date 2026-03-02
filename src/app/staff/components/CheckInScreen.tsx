"use client";

import { useState } from "react";
import { MemberSearchResult, CheckInDto } from "@/lib/staff-api";
import { getTierColor, getTierDisplayName } from "@/lib/tier-utils";
import QuestionnaireForm, { QuestionnaireData } from "./QuestionnaireForm";

interface CheckInScreenProps {
  searchResult: MemberSearchResult | null;
  onSearch: (phoneNumber: string) => void;
  onCheckIn: (data: CheckInDto) => void;
}

export default function CheckInScreen({
  searchResult,
  onSearch,
  onCheckIn,
}: CheckInScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Clinical fields
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [temp, setTemp] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [hasConsent, setHasConsent] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    try {
      await onSearch(phoneNumber);
      // Reset questionnaire state when searching for new patient
      setShowQuestionnaire(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireSubmit = (questionnaireData: QuestionnaireData) => {
    // Merge questionnaire data with clinical intake
    onCheckIn({
      phoneNumber,
      chiefComplaint: questionnaireData.chiefComplaint || chiefComplaint,
      medicalHistory,
      vitals: { bp, pulse, temp },
      clinicalNotes,
      hasConsent,
      questionnaire: questionnaireData,
    });
  };

  const handleCheckInSubmit = () => {
    if (!chiefComplaint || !hasConsent) {
      alert("Please provide chief complaint and patient consent.");
      return;
    }

    // Show questionnaire form
    setShowQuestionnaire(true);
  };

  const showMemberFound =
    searchResult?.found && searchResult?.active && searchResult?.member;

  // If questionnaire is being filled, show only the questionnaire
  if (showQuestionnaire) {
    return (
      <QuestionnaireForm
        onSubmit={handleQuestionnaireSubmit}
        onCancel={() => setShowQuestionnaire(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Front Desk - Patient Check-In
      </h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Find Member
        </label>
        <div className="flex gap-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (0XXXXXXXXX)"
            className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searchResult && (
        <div className="mt-6">
          {/* Member Not Found */}
          {!searchResult.found && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-semibold">Member not found</p>
              <p className="text-red-600 text-sm mt-1">
                Please verify the phone number or ask the patient to register.
              </p>
            </div>
          )}

          {/* Member Found but No Active Subscription */}
          {searchResult.found && !searchResult.active && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800 font-semibold text-lg mb-2">
                No Active Subscription
              </p>
              <p className="text-yellow-700 mb-4">
                Patient: {searchResult.member?.fullName || "N/A"}
              </p>
              <button
                onClick={() => window.open("https://app.menodao.org", "_blank")}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
              >
                Subscribe Now
              </button>
            </div>
          )}

          {/* Member Found with Active Subscription */}
          {showMemberFound && (
            <div className="space-y-6">
              {/* Member Info Card */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {searchResult.member?.fullName || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {searchResult.member?.phoneNumber}
                    </p>
                  </div>
                  {searchResult.member?.tier && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(searchResult.member.tier)}`}
                    >
                      {getTierDisplayName(searchResult.member.tier)}
                    </span>
                  )}
                </div>

                {/* Claim Limit */}
                {searchResult.claimLimit && (
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">
                      Claim Allocation
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      KES {searchResult.claimLimit.remaining.toLocaleString()}{" "}
                      Remaining
                    </p>
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, (searchResult.claimLimit.remaining / Math.max(1, searchResult.claimLimit.allocated)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Form */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
                  Clinical Intake
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chief Complaint */}
                  <div className="space-y-4 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Chief Complaint <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g., Severe toothache in upper left molar"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                      required
                    />
                  </div>

                  {/* Medical History */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Medical History
                    </label>
                    <textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="e.g., Diabetic, allergic to Penicillin"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                    />
                  </div>

                  {/* Clinical Notes */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Clinical Initial Notes
                    </label>
                    <textarea
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="General observations (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                    />
                  </div>

                  {/* Vitals */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase">
                        Blood Pressure
                      </label>
                      <input
                        type="text"
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                        placeholder="120/80"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase">
                        Pulse Rate (bpm)
                      </label>
                      <input
                        type="text"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        placeholder="72"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase">
                        Temp (°C)
                      </label>
                      <input
                        type="text"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        placeholder="36.6"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hasConsent}
                      onChange={(e) => setHasConsent(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Patient Consent Acknowledgement
                      </p>
                      <p className="text-gray-600">
                        The patient has provided explicit consent for treatment
                        and for their clinical data to be processed for
                        record-keeping and insurance claiming purposes as per
                        the Data Protection Act.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCheckInSubmit}
                  disabled={!hasConsent || !chiefComplaint}
                  className="w-full px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                  CONTINUE TO QUESTIONNAIRE
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
