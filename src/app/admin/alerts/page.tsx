"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, NotificationHistory } from "@/lib/admin-api";
import {
  Bell,
  Send,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["admin", "alerts", "history", page],
    queryFn: () => adminApi.getNotificationHistory(page, 10),
  });

  const sendMutation = useMutation({
    mutationFn: () => adminApi.sendNotification(title, body),
    onSuccess: (data) => {
      setSuccess(`Notification sent to ${data.sentTo} devices`);
      setTitle("");
      setBody("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts", "history"] });
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to send notification");
      setSuccess(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim() || !body.trim()) {
      setError("Please enter both title and message");
      return;
    }

    sendMutation.mutate();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "web":
        return <Monitor className="w-4 h-4" />;
      case "android":
        return <Smartphone className="w-4 h-4" />;
      case "ios":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-gray-400 mt-1">Send push notifications to all users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Notification */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">Send Notification</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                maxLength={50}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-gray-500 text-xs mt-1">{title.length}/50 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter your notification message..."
                rows={4}
                maxLength={200}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <p className="text-gray-500 text-xs mt-1">{body.length}/200 characters</p>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xs mb-2">Preview</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{title || "Title"}</p>
                    <p className="text-gray-400 text-sm">{body || "Message body"}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send to All Users
                </>
              )}
            </button>
          </form>
        </div>

        {/* Notification History */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Notification History</h2>

          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history?.data.map((notification: NotificationHistory) => (
                  <div
                    key={notification.id}
                    className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-emerald-400 text-sm font-medium">
                          {notification.sentTo} sent
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(notification.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs">
                      <span>By {notification.sentBy}</span>
                      <span>•</span>
                      <span>{new Date(notification.sentAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}

                {(!history?.data || history.data.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No notifications sent yet
                  </div>
                )}
              </div>

              {/* Pagination */}
              {history && history.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-500 text-sm">
                    Page {page} of {history.meta.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= history.meta.totalPages}
                      className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
