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
  Pencil,
  GitBranch,
} from "lucide-react";
import { ClinicLocationPicker } from "@/components/ClinicLocationPicker";

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
  const [editingClinic, setEditingClinic] = useState<AdminClinic | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [branchParentId, setBranchParentId] = useState<string | null>(null);
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Add Clinic
          </button>
          <a
            href="/register-clinic"
            target="_blank"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Registration Link
          </a>
        </div>
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

              {/* Branches */}
              <ClinicBranchesSection
                clinicId={selectedClinic.id}
                onAddBranch={() => {
                  setBranchParentId(selectedClinic.id);
                  setSelectedClinic(null);
                  setShowCreateForm(true);
                }}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setEditingClinic(selectedClinic);
                    setSelectedClinic(null);
                  }}
                  className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
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
        <div className="fixed inset-0 z-60 flex items-center justify-center">
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

      {/* Edit Modal */}
      {editingClinic && (
        <AdminClinicEditForm
          clinic={editingClinic}
          onClose={() => setEditingClinic(null)}
          onSuccess={(msg) => {
            setToast({ message: msg, type: "success" });
            setEditingClinic(null);
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateForm && (
        <AdminClinicCreateForm
          onClose={() => {
            setShowCreateForm(false);
            setBranchParentId(null);
          }}
          onSuccess={(msg) => {
            setToast({ message: msg, type: "success" });
            setShowCreateForm(false);
            setBranchParentId(null);
          }}
          initialParentClinicId={branchParentId ?? undefined}
        />
      )}
    </div>
  );
}

function ClinicBranchesSection({
  clinicId,
  onAddBranch,
}: {
  clinicId: string;
  onAddBranch: () => void;
}) {
  const { data: branches, isLoading } = useQuery({
    queryKey: ["admin", "clinic-branches", clinicId],
    queryFn: () => adminApi.getClinicBranches(clinicId),
  });

  return (
    <div className="bg-gray-700/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Branches
        </h3>
        <button
          onClick={onAddBranch}
          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
        >
          <GitBranch className="w-3 h-3" />
          Add Branch
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        </div>
      ) : !branches?.length ? (
        <p className="text-gray-500 text-sm text-center py-2">No branches</p>
      ) : (
        <div className="space-y-2">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-white text-sm">{branch.name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={branch.status} />
                <MapPin
                  className={`w-4 h-4 ${
                    branch.latitude != null && branch.longitude != null
                      ? "text-emerald-400"
                      : "text-gray-600"
                  }`}
                />
              </div>
            </div>
          ))}
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

// ---------------------------------------------------------------------------
// AdminClinicEditForm
// ---------------------------------------------------------------------------

interface EditFormState {
  name: string;
  subCounty: string;
  physicalLocation: string;
  googleMapsLink: string;
  operatingHours: string;
  operatesOnWeekends: boolean;
  leadDentistName: string;
  ownerPhone: string;
  managerName: string;
  whatsappNumber: string;
  email: string;
  mpesaTillOrPaybill: string;
  tillPaybillName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  kmpdcRegNumber: string;
  activeDentalChairs: string;
  latitude: string;
  longitude: string;
  branchName: string;
}

function toFormState(clinic: AdminClinic): EditFormState {
  return {
    name: clinic.name ?? "",
    subCounty: clinic.subCounty ?? "",
    physicalLocation: clinic.physicalLocation ?? "",
    googleMapsLink: clinic.googleMapsLink ?? "",
    operatingHours: clinic.operatingHours ?? "",
    operatesOnWeekends: clinic.operatesOnWeekends ?? false,
    leadDentistName: clinic.leadDentistName ?? "",
    ownerPhone: clinic.ownerPhone ?? "",
    managerName: clinic.managerName ?? "",
    whatsappNumber: clinic.whatsappNumber ?? "",
    email: clinic.email ?? "",
    mpesaTillOrPaybill: clinic.mpesaTillOrPaybill ?? "",
    tillPaybillName: clinic.tillPaybillName ?? "",
    bankAccountName: (clinic as any).bankAccountName ?? "",
    bankAccountNumber: (clinic as any).bankAccountNumber ?? "",
    kmpdcRegNumber: clinic.kmpdcRegNumber ?? "",
    activeDentalChairs: String(clinic.activeDentalChairs ?? ""),
    latitude: clinic.latitude != null ? String(clinic.latitude) : "",
    longitude: clinic.longitude != null ? String(clinic.longitude) : "",
    branchName: clinic.branchName ?? "",
  };
}

function AdminClinicEditForm({
  clinic,
  onClose,
  onSuccess,
}: {
  clinic: AdminClinic;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EditFormState>(() => toFormState(clinic));
  const [inlineError, setInlineError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AdminClinic>) =>
      adminApi.updateClinic(clinic.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
      onSuccess("Clinic updated successfully");
    },
    onError: (err: Error) => {
      setInlineError(err.message || "Failed to update clinic");
    },
  });

  function set(field: keyof EditFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setInlineError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Partial<AdminClinic> = {
      name: form.name,
      subCounty: form.subCounty,
      physicalLocation: form.physicalLocation,
      googleMapsLink: form.googleMapsLink || null,
      operatingHours: form.operatingHours,
      operatesOnWeekends: form.operatesOnWeekends,
      leadDentistName: form.leadDentistName,
      ownerPhone: form.ownerPhone,
      managerName: form.managerName || undefined,
      whatsappNumber: form.whatsappNumber,
      email: form.email || undefined,
      mpesaTillOrPaybill: form.mpesaTillOrPaybill,
      tillPaybillName: form.tillPaybillName,
      kmpdcRegNumber: form.kmpdcRegNumber || undefined,
      activeDentalChairs: form.activeDentalChairs
        ? parseInt(form.activeDentalChairs, 10)
        : 0,
      latitude: form.latitude !== "" ? parseFloat(form.latitude) : null,
      longitude: form.longitude !== "" ? parseFloat(form.longitude) : null,
      branchName: form.branchName || null,
      ...(form.bankAccountName
        ? { bankAccountName: form.bankAccountName }
        : {}),
      ...(form.bankAccountNumber
        ? { bankAccountNumber: form.bankAccountNumber }
        : {}),
    };
    updateMutation.mutate(payload);
  }

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Pencil className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Edit Clinic</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[75vh]">
          <div className="px-6 py-5 space-y-6">
            {/* Basic Info */}
            <FormSection title="Basic Info">
              <FormField label="Clinic Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  className={inputCls}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Sub-County" required>
                  <input
                    type="text"
                    value={form.subCounty}
                    onChange={(e) => set("subCounty", e.target.value)}
                    required
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Branch Name">
                  <input
                    type="text"
                    value={form.branchName}
                    onChange={(e) => set("branchName", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>
              <FormField label="Physical Location" required>
                <input
                  type="text"
                  value={form.physicalLocation}
                  onChange={(e) => set("physicalLocation", e.target.value)}
                  required
                  className={inputCls}
                />
              </FormField>
              <FormField label="Google Maps Link">
                <input
                  type="url"
                  value={form.googleMapsLink}
                  onChange={(e) => set("googleMapsLink", e.target.value)}
                  className={inputCls}
                  placeholder="https://maps.google.com/..."
                />
              </FormField>
              <ClinicLocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onLatChange={(v) => set("latitude", v)}
                onLngChange={(v) => set("longitude", v)}
                theme="dark"
              />
            </FormSection>

            {/* Operations */}
            <FormSection title="Operations">
              <FormField label="Operating Hours">
                <input
                  type="text"
                  value={form.operatingHours}
                  onChange={(e) => set("operatingHours", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Mon–Fri 8am–5pm"
                />
              </FormField>
              <div className="flex items-center gap-3">
                <input
                  id="operatesOnWeekends"
                  type="checkbox"
                  checked={form.operatesOnWeekends}
                  onChange={(e) => set("operatesOnWeekends", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500/50"
                />
                <label
                  htmlFor="operatesOnWeekends"
                  className="text-sm text-gray-300"
                >
                  Operates on weekends
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Active Dental Chairs" required>
                  <input
                    type="number"
                    min={0}
                    value={form.activeDentalChairs}
                    onChange={(e) => set("activeDentalChairs", e.target.value)}
                    required
                    className={inputCls}
                  />
                </FormField>
                <FormField label="KMPDC Reg Number">
                  <input
                    type="text"
                    value={form.kmpdcRegNumber}
                    onChange={(e) => set("kmpdcRegNumber", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Contact */}
            <FormSection title="Contact">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Lead Dentist Name" required>
                  <input
                    type="text"
                    value={form.leadDentistName}
                    onChange={(e) => set("leadDentistName", e.target.value)}
                    required
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Manager Name">
                  <input
                    type="text"
                    value={form.managerName}
                    onChange={(e) => set("managerName", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Owner Phone" required>
                  <input
                    type="tel"
                    value={form.ownerPhone}
                    onChange={(e) => set("ownerPhone", e.target.value)}
                    required
                    className={inputCls}
                  />
                </FormField>
                <FormField label="WhatsApp Number" required>
                  <input
                    type="tel"
                    value={form.whatsappNumber}
                    onChange={(e) => set("whatsappNumber", e.target.value)}
                    required
                    className={inputCls}
                  />
                </FormField>
              </div>
              <FormField label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                />
              </FormField>
            </FormSection>

            {/* Payment */}
            <FormSection title="Payment">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="M-Pesa Till / Paybill" required>
                  <input
                    type="text"
                    value={form.mpesaTillOrPaybill}
                    onChange={(e) => set("mpesaTillOrPaybill", e.target.value)}
                    required
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Till / Paybill Name" required>
                  <input
                    type="text"
                    value={form.tillPaybillName}
                    onChange={(e) => set("tillPaybillName", e.target.value)}
                    required
                    className={inputCls}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Bank Account Name">
                  <input
                    type="text"
                    value={form.bankAccountName}
                    onChange={(e) => set("bankAccountName", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Bank Account Number">
                  <input
                    type="text"
                    value={form.bankAccountNumber}
                    onChange={(e) => set("bankAccountNumber", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Inline error */}
            {inlineError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <X className="w-4 h-4 shrink-0" />
                {inlineError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50";

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminClinicCreateForm
// ---------------------------------------------------------------------------

interface CreateFormState {
  // Required
  name: string;
  subCounty: string;
  physicalLocation: string;
  operatingHours: string;
  leadDentistName: string;
  ownerPhone: string;
  whatsappNumber: string;
  mpesaTillOrPaybill: string;
  tillPaybillName: string;
  activeDentalChairs: string;
  agreedToRateCard: boolean;
  agreedToNoChargePolicy: boolean;
  // Optional
  email: string;
  managerName: string;
  googleMapsLink: string;
  latitude: string;
  longitude: string;
  branchName: string;
  parentClinicId: string;
  kmpdcRegNumber: string;
  bankAccountName: string;
  bankAccountNumber: string;
  operatesOnWeekends: boolean;
  // Status
  status: "PENDING" | "APPROVED";
}

const defaultCreateForm: CreateFormState = {
  name: "",
  subCounty: "",
  physicalLocation: "",
  operatingHours: "",
  leadDentistName: "",
  ownerPhone: "",
  whatsappNumber: "",
  mpesaTillOrPaybill: "",
  tillPaybillName: "",
  activeDentalChairs: "1",
  agreedToRateCard: false,
  agreedToNoChargePolicy: false,
  email: "",
  managerName: "",
  googleMapsLink: "",
  latitude: "",
  longitude: "",
  branchName: "",
  parentClinicId: "",
  kmpdcRegNumber: "",
  bankAccountName: "",
  bankAccountNumber: "",
  operatesOnWeekends: false,
  status: "PENDING",
};

function AdminClinicCreateForm({
  onClose,
  onSuccess,
  initialParentClinicId,
}: {
  onClose: () => void;
  onSuccess: (msg: string) => void;
  initialParentClinicId?: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateFormState>(() => ({
    ...defaultCreateForm,
    parentClinicId: initialParentClinicId ?? "",
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createClinic(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] });
      onSuccess(`Clinic "${data.name}" created successfully`);
    },
    onError: (err: Error) => {
      // Try to parse field-level validation errors from the message
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setFieldErrors(parsed as Record<string, string>);
          return;
        }
      } catch {
        // Not JSON — fall through to inline error
      }
      setInlineError(err.message || "Failed to create clinic");
    },
  });

  function set(field: keyof CreateFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setInlineError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setInlineError(null);

    const payload: Record<string, unknown> = {
      name: form.name,
      subCounty: form.subCounty,
      physicalLocation: form.physicalLocation,
      operatingHours: form.operatingHours,
      leadDentistName: form.leadDentistName,
      ownerPhone: form.ownerPhone,
      whatsappNumber: form.whatsappNumber,
      mpesaTillOrPaybill: form.mpesaTillOrPaybill,
      tillPaybillName: form.tillPaybillName,
      activeDentalChairs: form.activeDentalChairs
        ? parseInt(form.activeDentalChairs, 10)
        : 1,
      agreedToRateCard: form.agreedToRateCard,
      agreedToNoChargePolicy: form.agreedToNoChargePolicy,
      status: form.status,
      operatesOnWeekends: form.operatesOnWeekends,
    };

    if (form.email) payload.email = form.email;
    if (form.managerName) payload.managerName = form.managerName;
    if (form.googleMapsLink) payload.googleMapsLink = form.googleMapsLink;
    if (form.latitude !== "") payload.latitude = parseFloat(form.latitude);
    if (form.longitude !== "") payload.longitude = parseFloat(form.longitude);
    if (form.branchName) payload.branchName = form.branchName;
    if (form.parentClinicId) payload.parentClinicId = form.parentClinicId;
    if (form.kmpdcRegNumber) payload.kmpdcRegNumber = form.kmpdcRegNumber;
    if (form.bankAccountName) payload.bankAccountName = form.bankAccountName;
    if (form.bankAccountNumber)
      payload.bankAccountNumber = form.bankAccountNumber;

    createMutation.mutate(payload);
  }

  function fieldError(field: keyof CreateFormState) {
    return fieldErrors[field] ? (
      <p className="text-xs text-red-400 mt-1">{fieldErrors[field]}</p>
    ) : null;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Add Clinic</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[75vh]">
          <div className="px-6 py-5 space-y-6">
            {/* Basic Info */}
            <FormSection title="Basic Info">
              <FormField label="Clinic Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  className={inputCls}
                  placeholder="e.g. Smile Dental Clinic"
                />
                {fieldError("name")}
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Sub-County" required>
                  <input
                    type="text"
                    value={form.subCounty}
                    onChange={(e) => set("subCounty", e.target.value)}
                    required
                    className={inputCls}
                    placeholder="e.g. Westlands"
                  />
                  {fieldError("subCounty")}
                </FormField>
                <FormField label="Branch Name">
                  <input
                    type="text"
                    value={form.branchName}
                    onChange={(e) => set("branchName", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Main Branch"
                  />
                  {fieldError("branchName")}
                </FormField>
              </div>
              <FormField label="Physical Location" required>
                <input
                  type="text"
                  value={form.physicalLocation}
                  onChange={(e) => set("physicalLocation", e.target.value)}
                  required
                  className={inputCls}
                  placeholder="e.g. 2nd Floor, ABC Plaza"
                />
                {fieldError("physicalLocation")}
              </FormField>
              <FormField label="Parent Clinic ID">
                <input
                  type="text"
                  value={form.parentClinicId}
                  onChange={(e) => set("parentClinicId", e.target.value)}
                  className={inputCls}
                  placeholder="UUID of parent clinic (if branch)"
                />
                {fieldError("parentClinicId")}
              </FormField>
              <FormField label="Google Maps Link">
                <input
                  type="url"
                  value={form.googleMapsLink}
                  onChange={(e) => set("googleMapsLink", e.target.value)}
                  className={inputCls}
                  placeholder="https://maps.google.com/..."
                />
                {fieldError("googleMapsLink")}
              </FormField>
              <ClinicLocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onLatChange={(v) => set("latitude", v)}
                onLngChange={(v) => set("longitude", v)}
                theme="dark"
              />
            </FormSection>

            {/* Operations */}
            <FormSection title="Operations">
              <FormField label="Operating Hours" required>
                <input
                  type="text"
                  value={form.operatingHours}
                  onChange={(e) => set("operatingHours", e.target.value)}
                  required
                  className={inputCls}
                  placeholder="e.g. Mon–Fri 8am–5pm"
                />
                {fieldError("operatingHours")}
              </FormField>
              <div className="flex items-center gap-3">
                <input
                  id="create-operatesOnWeekends"
                  type="checkbox"
                  checked={form.operatesOnWeekends}
                  onChange={(e) => set("operatesOnWeekends", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500/50"
                />
                <label
                  htmlFor="create-operatesOnWeekends"
                  className="text-sm text-gray-300"
                >
                  Operates on weekends
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Active Dental Chairs" required>
                  <input
                    type="number"
                    min={1}
                    value={form.activeDentalChairs}
                    onChange={(e) => set("activeDentalChairs", e.target.value)}
                    required
                    className={inputCls}
                  />
                  {fieldError("activeDentalChairs")}
                </FormField>
                <FormField label="KMPDC Reg Number">
                  <input
                    type="text"
                    value={form.kmpdcRegNumber}
                    onChange={(e) => set("kmpdcRegNumber", e.target.value)}
                    className={inputCls}
                  />
                  {fieldError("kmpdcRegNumber")}
                </FormField>
              </div>
            </FormSection>

            {/* Contact */}
            <FormSection title="Contact">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Lead Dentist Name" required>
                  <input
                    type="text"
                    value={form.leadDentistName}
                    onChange={(e) => set("leadDentistName", e.target.value)}
                    required
                    className={inputCls}
                  />
                  {fieldError("leadDentistName")}
                </FormField>
                <FormField label="Manager Name">
                  <input
                    type="text"
                    value={form.managerName}
                    onChange={(e) => set("managerName", e.target.value)}
                    className={inputCls}
                  />
                  {fieldError("managerName")}
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Owner Phone" required>
                  <input
                    type="tel"
                    value={form.ownerPhone}
                    onChange={(e) => set("ownerPhone", e.target.value)}
                    required
                    className={inputCls}
                    placeholder="+254..."
                  />
                  {fieldError("ownerPhone")}
                </FormField>
                <FormField label="WhatsApp Number" required>
                  <input
                    type="tel"
                    value={form.whatsappNumber}
                    onChange={(e) => set("whatsappNumber", e.target.value)}
                    required
                    className={inputCls}
                    placeholder="+254..."
                  />
                  {fieldError("whatsappNumber")}
                </FormField>
              </div>
              <FormField label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                  placeholder="clinic@example.com"
                />
                {fieldError("email")}
              </FormField>
            </FormSection>

            {/* Payment */}
            <FormSection title="Payment">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="M-Pesa Till / Paybill" required>
                  <input
                    type="text"
                    value={form.mpesaTillOrPaybill}
                    onChange={(e) => set("mpesaTillOrPaybill", e.target.value)}
                    required
                    className={inputCls}
                    placeholder="e.g. 123456"
                  />
                  {fieldError("mpesaTillOrPaybill")}
                </FormField>
                <FormField label="Till / Paybill Name" required>
                  <input
                    type="text"
                    value={form.tillPaybillName}
                    onChange={(e) => set("tillPaybillName", e.target.value)}
                    required
                    className={inputCls}
                    placeholder="e.g. Smile Dental"
                  />
                  {fieldError("tillPaybillName")}
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Bank Account Name">
                  <input
                    type="text"
                    value={form.bankAccountName}
                    onChange={(e) => set("bankAccountName", e.target.value)}
                    className={inputCls}
                  />
                  {fieldError("bankAccountName")}
                </FormField>
                <FormField label="Bank Account Number">
                  <input
                    type="text"
                    value={form.bankAccountNumber}
                    onChange={(e) => set("bankAccountNumber", e.target.value)}
                    className={inputCls}
                  />
                  {fieldError("bankAccountNumber")}
                </FormField>
              </div>
            </FormSection>

            {/* Agreements */}
            <FormSection title="Agreements">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    id="create-agreedToRateCard"
                    type="checkbox"
                    checked={form.agreedToRateCard}
                    onChange={(e) => set("agreedToRateCard", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <label
                    htmlFor="create-agreedToRateCard"
                    className="text-sm text-gray-300"
                  >
                    Agreed to Rate Card <span className="text-red-400">*</span>
                  </label>
                </div>
                {fieldError("agreedToRateCard")}
                <div className="flex items-start gap-3">
                  <input
                    id="create-agreedToNoChargePolicy"
                    type="checkbox"
                    checked={form.agreedToNoChargePolicy}
                    onChange={(e) =>
                      set("agreedToNoChargePolicy", e.target.checked)
                    }
                    className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <label
                    htmlFor="create-agreedToNoChargePolicy"
                    className="text-sm text-gray-300"
                  >
                    Agreed to No-Charge Policy{" "}
                    <span className="text-red-400">*</span>
                  </label>
                </div>
                {fieldError("agreedToNoChargePolicy")}
              </div>
            </FormSection>

            {/* Status */}
            <FormSection title="Status">
              <FormField label="Initial Status" required>
                <select
                  value={form.status}
                  onChange={(e) =>
                    set("status", e.target.value as "PENDING" | "APPROVED")
                  }
                  className={inputCls}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                </select>
                {fieldError("status")}
              </FormField>
              {form.status === "APPROVED" && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <span>⚠</span>
                  Setting to APPROVED will immediately generate staff
                  credentials.
                </p>
              )}
            </FormSection>

            {/* Inline error */}
            {inlineError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <X className="w-4 h-4 shrink-0" />
                {inlineError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {createMutation.isPending ? "Creating..." : "Create Clinic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
