"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, VoiceMetricsResponse } from "@/lib/admin-api";
import { Mic, Loader2 } from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function VoiceMetricsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useQuery<VoiceMetricsResponse>({
    queryKey: ["admin", "voice-metrics", days],
    queryFn: () => adminApi.getVoiceMetrics(days),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mic className="h-6 w-6 text-emerald-400" />
            Voice metrics
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            WhatsApp voice conversations, transcription confidence, and recent
            routing decisions.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading voice metrics…
        </div>
      ) : error ? (
        <p className="text-red-400">Could not load voice metrics.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
              <p className="text-sm text-gray-400">Voice conversations</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {data?.totalVoiceConversations ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
              <p className="text-sm text-gray-400">Average confidence</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {data?.averageConfidence ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
              <p className="text-sm text-gray-400">Low-confidence events</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {data?.lowConfidenceCount ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
            <h2 className="text-lg font-semibold text-white">Recent conversations</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Language</th>
                    <th className="pb-2 pr-4">Intent</th>
                    <th className="pb-2 pr-4">Confidence</th>
                    <th className="pb-2 pr-4">Transcript chars</th>
                    <th className="pb-2 pr-4">Duration (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent ?? []).map((row) => (
                    <tr key={row.id} className="border-t border-gray-700 text-gray-200">
                      <td className="py-2 pr-4">
                        {new Date(row.occurredAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{row.detectedLanguage ?? "—"}</td>
                      <td className="py-2 pr-4">{row.intent ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {row.intentConfidence?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-2 pr-4">{row.transcriptLength ?? "—"}</td>
                      <td className="py-2 pr-4">{row.audioDuration ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data?.recent?.length ?? 0) === 0 && (
                <p className="py-4 text-gray-500">No voice conversations yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}