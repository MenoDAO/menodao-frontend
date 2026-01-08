"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import {
  isPushSupported,
  getNotificationPermission,
  registerForPushNotifications,
} from "@/lib/notifications";

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    if (!isPushSupported()) return;
    
    const permission = getNotificationPermission();
    const dismissed = localStorage.getItem("notification-prompt-dismissed");
    
    // Show prompt if permission hasn't been decided and not dismissed
    if (permission === "default" && !dismissed) {
      // Wait a bit before showing
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRegistering(true);
    try {
      await registerForPushNotifications();
      setShowPrompt(false);
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Enable Notifications
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Get instant updates about your payments, claims, and dental camps.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={isRegistering}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isRegistering ? "Enabling..." : "Enable"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
