"use client";

import { useSearchParams } from "next/navigation";
import { SendNotification } from "../../components/SendNotification";

export default function SendNotificationPage() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") ?? undefined;
  // Bulk: comma-separated phone list pre-populates the CSV field
  const initialPhones = searchParams.get("phones") ?? undefined;
  const initialTier = searchParams.get("tier") ?? undefined;
  const initialStatus = searchParams.get("status") ?? undefined;
  const initialMessage = searchParams.get("message") ?? undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Send Notification</h1>
        <p className="text-gray-400 mt-1">
          Compose and send SMS or push notifications to filtered member groups
        </p>
      </div>

      {/* Send Notification Component */}
      <SendNotification
        initialPhone={initialPhone}
        initialPhones={initialPhones}
        initialTier={initialTier as any}
        initialStatus={initialStatus as any}
        initialMessage={initialMessage}
      />
    </div>
  );
}
