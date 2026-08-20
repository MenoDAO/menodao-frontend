"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { AuditLog } from "../components/AuditLog";
import { Shield } from "lucide-react";

export default function OperationsLogPage() {
  const router = useRouter();
  const admin = useAdminStore((state) => state.admin);
  const isMasterAdmin = admin?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (admin && !isMasterAdmin) {
      router.replace("/admin/operations");
    }
  }, [admin, isMasterAdmin, router]);

  if (!isMasterAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-400">Restricted to master admins</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
            Super admin
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">Operations log</h1>
        <p className="mt-1 text-gray-400">
          Global record of sensitive admin actions across members, payments, and
          subscriptions. Your personal actions also appear under Settings.
        </p>
      </div>

      <AuditLog limit={100} enabled tall title="All admin actions" />
    </div>
  );
}
