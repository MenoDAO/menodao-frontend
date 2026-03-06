"use client";

import Link from "next/link";
import { Bell, Send, History, ArrowRight } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Alerts & Notifications
        </h1>
        <p className="text-gray-400 mt-1">
          Manage SMS and push notifications for your members
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Notification Card */}
        <Link
          href="/admin/alerts/send"
          className="group bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-600/20 rounded-lg group-hover:bg-emerald-600/30 transition-colors">
              <Send className="w-6 h-6 text-emerald-500" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Send Notification
          </h2>
          <p className="text-gray-400 text-sm">
            Compose and send SMS or push notifications to filtered member groups
            with advanced targeting options
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-sm font-medium">
            <span>Compose message</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Notification History Card */}
        <Link
          href="/admin/alerts/history"
          className="group bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
              <History className="w-6 h-6 text-blue-500" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Notification History
          </h2>
          <p className="text-gray-400 text-sm">
            View all sent notifications, track delivery status, and monitor
            success rates with detailed analytics
          </p>
          <div className="mt-4 flex items-center gap-2 text-blue-500 text-sm font-medium">
            <span>View history</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
