"use client";

import { useState } from "react";
import { MemberSearchResult, CheckInDto } from "@/lib/staff-api";

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

  // Clinical fields state
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
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInSubmit = () => {
    if (!chiefComplaint || !hasConsent) {
      alert("Please provide chief complaint and patient consent.");
      return;
    }

    onCheckIn({
      phoneNumber,
      chiefComplaint,
      medicalHistory,
      vitals: { bp, pulse, temp },
      clinicalNotes,
      hasConsent,
    });
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Front Desk - Patient Check-In
      </h2>

      <form onSubmit={handleSearch} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Find Member
        </label>
        <div className="flex gap-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (0XXXXXXXXX)"
            className="flex-1 px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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

      {searchResult && (
        <div className="mt-6 space-y-6">
          {!searchResult.found ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 font-semibold">
                Member not found
              </p>
              <p className="text-red-600 dark:text-red-500 text-sm mt-1">
                Please verify the phone number or ask the patient to register.
              </p>
            </div>
          ) : !searchResult.active ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <p className="text-yellow-800 dark:text-yellow-300 font-semibold text-lg mb-2">
                No Active Subscription
              </p>
              <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                Patient: {searchResult.member?.fullName || "N/A"}
              </p>
              <button
                onClick={() => window.open("https://app.menodao.org", "_blank")}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
              >
                Subscribe Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Member Summary Card */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {searchResult.member?.fullName || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchResult.member?.phoneNumber}
                    </p>
                  </div>
                  {searchResult.member?.tier && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierBadgeColor(
                        searchResult.member.tier,
                      )}`}
                    >
                      {searchResult.member.tier}
                    </span>
                  )}
                </div>

                {searchResult.claimLimit && (
                  <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase">
                      Claim Allocation
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      KES {searchResult.claimLimit.remaining.toLocaleString()}{" "}
                      Remaining
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full transition-all duration-500"
                        style={{
                          width: `${searchResult.claimLimit.allocated > 0 ? (searchResult.claimLimit.remaining / searchResult.claimLimit.allocated) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Data Form */}
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
                  Clinical Intake
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Chief Complaint <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g., Severe toothache in upper left molar"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white h-24"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Medical History
                    </label>
                    <textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="e.g., Diabetic, allergic to Penicillin"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white h-24"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Clinical Initial Notes
                    </label>
                    <textarea
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="General observations (optional)"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white h-24"
                    />
                  </div>

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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hasConsent}
                      onChange={(e) => setHasConsent(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        Patient Consent Acknowledgement
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        The patient has provided explicit consent for treatment
                        and for their clinical data to be processed for
                        record-keeping and insurance claiming purposes as per
                        the Data Protection Act.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleCheckInSubmit}
                  disabled={!hasConsent || !chiefComplaint}
                  className="w-full px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                  COMPLETE CHECK-IN & SEND TO TREATMENT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
