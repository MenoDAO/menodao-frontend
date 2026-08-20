"use client";

import { Loader2 } from "lucide-react";
import type { ActivityItem } from "@/lib/activity";
import { formatRelativeTime } from "@/lib/activity";

export function ActivityTimeline({
  title = "Recent activity",
  subtitle = "A brief log of actions on this account",
  items,
  isLoading,
  error,
  empty,
  tone = "light",
}: {
  title?: string;
  subtitle?: string;
  items?: ActivityItem[];
  isLoading?: boolean;
  error?: boolean;
  empty?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const card = dark
    ? "bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
    : "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden";
  const heading = dark ? "text-white" : "text-gray-900 dark:text-white";
  const muted = dark ? "text-gray-400" : "text-gray-500 dark:text-gray-400";
  const divider = dark ? "border-gray-700" : "border-gray-200 dark:border-gray-700";
  const line = dark ? "bg-gray-700" : "bg-gray-200 dark:bg-gray-700";
  const titleColor = dark ? "text-gray-100" : "text-gray-800 dark:text-gray-100";

  return (
    <section className={card}>
      <div className={`px-6 py-4 border-b ${divider}`}>
        <h2 className={`font-semibold ${heading}`}>{title}</h2>
        <p className={`mt-1 text-sm ${muted}`}>{subtitle}</p>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className={`flex items-center gap-2 text-sm ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activity…
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">Could not load recent activity.</p>
        ) : !items?.length ? (
          <p className={`text-sm ${muted}`}>
            {empty || "No recent actions yet. Activity from this account will appear here."}
          </p>
        ) : (
          <ol className="relative space-y-0">
            {items.map((item, index) => (
              <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
                {index < items.length - 1 && (
                  <span
                    className={`absolute left-1 top-4 h-[calc(100%-8px)] w-px ${line}`}
                  />
                )}
                <span
                  className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.kind === "VISIT"
                      ? "bg-blue-500"
                      : item.kind === "APPOINTMENT"
                        ? "bg-violet-500"
                        : item.kind === "AUDIT"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm font-medium ${titleColor}`}>
                      {item.title}
                    </p>
                    <time className={`shrink-0 text-xs ${muted}`}>
                      {formatRelativeTime(item.at)}
                    </time>
                  </div>
                  {item.detail && (
                    <p className={`mt-0.5 text-xs ${muted}`}>{item.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
