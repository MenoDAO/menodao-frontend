"use client";

import { NotificationHistory } from "../../components/NotificationHistory";

export default function NotificationHistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Notification History</h1>
        <p className="text-gray-400 mt-1">
          View all sent notifications and their delivery status
        </p>
      </div>

      {/* Notification History Component */}
      <NotificationHistory />
    </div>
  );
}
