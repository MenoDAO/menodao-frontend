"use client";

import { useSearchParams } from "next/navigation";
import { SendNotification } from "../../components/SendNotification";

export default function SendNotificationPage() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") ?? undefined;
  const initialTier = searchParams.get("tier") ?? undefined;
  const initialStatus = searchParams.get("status") ?? undefined;

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
        initialTier={initialTier as any}
        initialStatus={initialStatus as any}
      />
    </div>
  );
}
