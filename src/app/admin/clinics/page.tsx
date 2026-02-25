"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, AdminClinic } from "@/lib/admin-api";
import {
  Building2,
  Check,
  X,
  Clock,
  Ban,
  ChevronRight,
  Loader2,
  Phone,
  MapPin,
} from "lucide-react";

type StatusFilter = "" | "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REJECTED", label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    APPROVED: "bg-emerald-500/20 text-emerald-400",
    SUSPENDED: "bg-red-500/20 text-red-400",
    REJECTED: "bg-gray-500/20 text-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.PENDING}`}
    >
      {status === "PENDING" && <Clock className="w-3 h-3" />}
      {status === "APPROVED" && <Check className="w-3 h-3" />}
      {status === "SUSPENDED" && <Ban className="w-3 h-3" />}
      {status === "REJECTED" && <X className="w-3 h-3" />}
      {status}
    </span>
  );
}

export default function AdminClinicsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [selectedClinic, setSelectedClinic] = useState<AdminClinic | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: clinics, isLoading } = useQuery({
    queryKey: ["admin", "clinics", statusFilter],
    queryFn: () => adminApi.listClinics(statusFilter || undefined),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveClinic(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
      setToast({
        message: data.message || "Clinic approved successfully",
        type: "success",
      });
      setSelectedClinic(null);
    },
    onError: () => {
      setToast({ message: "Failed to approve clinic", type: "error" });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendClinic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
      setToast({ message: "Clinic suspended", type: "success" });
      setSelectedClinic(null);
    },
    onError: () => {
      setToast({ message: "Failed to suspend clinic", type: "error" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectClinic(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
      setToast({ message: "Clinic rejected", type: "success" });
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedClinic(null);
    },
    onError: () => {
      setToast({ message: "Failed to reject clinic", type: "error" });
    },
  });

  // Auto-dismiss toast
  if (toast) {
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-100 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage partner clinic applications
          </p>
        </div>
        <a
          href="/register-clinic"
          target="_blank"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Registration Link
        </a>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : !clinics?.length ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No clinics found</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-6 text-gray-400 text-xs font-semibold uppercase">
                  Clinic
                </th>
                <th className="text-left py-3 px-6 text-gray-400 text-xs font-semibold uppercase">
                  Location
                </th>
                <th className="text-left py-3 px-6 text-gray-400 text-xs font-semibold uppercase">
                  Contact
                </th>
                <th className="text-left py-3 px-6 text-gray-400 text-xs font-semibold uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-gray-400 text-xs font-semibold uppercase">
                  Staff
                </th>
                <th className="py-3 px-6" />
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic) => (
                <tr
                  key={clinic.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedClinic(clinic)}
                >
                  <td className="py-4 px-6">
                    <p className="text-white font-medium">{clinic.name}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(clinic.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-gray-300 text-sm">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      {clinic.subCounty}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-gray-300 text-sm">
                      {clinic.leadDentistName}
                    </p>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Phone className="w-3 h-3" />
                      {clinic.ownerPhone}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={clinic.status} />
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-sm">
                    {clinic._count.staffUsers}
                  </td>
                  <td className="py-4 px-6">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedClinic && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedClinic(null)}
          />
          <div className="relative w-full max-w-lg bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedClinic.name}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {selectedClinic.subCounty} •{" "}
                    {selectedClinic.physicalLocation}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClinic(null)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <StatusBadge status={selectedClinic.status} />

              {/* Clinic info sections */}
              <div className="space-y-4">
                <Section title="Contact">
                  <Info
                    label="Lead Dentist"
                    value={selectedClinic.leadDentistName}
                  />
                  <Info label="Owner Phone" value={selectedClinic.ownerPhone} />
                  <Info
                    label="Manager"
                    value={selectedClinic.managerName || "—"}
                  />
                  <Info
                    label="WhatsApp"
                    value={selectedClinic.whatsappNumber}
                  />
                  <Info label="Email" value={selectedClinic.email || "—"} />
                </Section>
                <Section title="Payment">
                  <Info
                    label="Till/Paybill"
                    value={selectedClinic.mpesaTillOrPaybill}
                  />
                  <Info
                    label="Account Name"
                    value={selectedClinic.tillPaybillName}
                  />
                </Section>
                <Section title="Capacity">
                  <Info
                    label="Dental Chairs"
                    value={String(selectedClinic.activeDentalChairs)}
                  />
                  <Info
                    label="KMPDC Reg"
                    value={selectedClinic.kmpdcRegNumber || "—"}
                  />
                </Section>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                {selectedClinic.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(selectedClinic.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {approveMutation.isPending
                        ? "Approving..."
                        : "Approve & Generate Credentials"}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedClinic.status === "APPROVED" && (
                  <button
                    onClick={() => suspendMutation.mutate(selectedClinic.id)}
                    disabled={suspendMutation.isPending}
                    className="px-4 py-2.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {suspendMutation.isPending ? "Suspending..." : "Suspend"}
                  </button>
                )}
                {selectedClinic.status === "SUSPENDED" && (
                  <button
                    onClick={() => approveMutation.mutate(selectedClinic.id)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {approveMutation.isPending
                      ? "Reactivating..."
                      : "Reactivate"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedClinic && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              Reject {selectedClinic.name}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() =>
                  rejectMutation.mutate({
                    id: selectedClinic.id,
                    reason: rejectReason,
                  })
                }
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
