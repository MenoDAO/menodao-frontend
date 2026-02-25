"use client";

import { useState, useEffect, useCallback } from "react";
import { staffApi, Clinic } from "@/lib/staff-api";

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadClinics = useCallback(async () => {
    try {
      const statusFilter = filter === "all" ? undefined : filter;
      const data = await staffApi.getClinics(statusFilter);
      setClinics(data);
    } catch (error) {
      console.error("Failed to load clinics:", error);
      alert("Failed to load clinics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "REJECTED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Registered Clinics</h1>
        <button
          onClick={() => window.open("/register-clinic", "_blank")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          + Add New Clinic
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {["all", "APPROVED", "PENDING", "SUSPENDED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === status
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {status === "all"
              ? "All"
              : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {clinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            No clinics found{filter !== "all" ? ` with status: ${filter}` : ""}.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {clinic.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(
                    clinic.status,
                  )}`}
                >
                  {clinic.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>
                  <span className="font-semibold">Location:</span> {clinic.ward}
                  , {clinic.subCounty}
                </p>
                <p>
                  <span className="font-semibold">Contact:</span>{" "}
                  {clinic.contactPerson}
                </p>
                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {clinic.contactPhone}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {clinic.contactEmail}
                </p>
                <p className="text-xs text-gray-500">
                  Registered: {formatDate(clinic.createdAt)}
                </p>
                {clinic.approvedAt && (
                  <p className="text-xs text-gray-500">
                    Approved: {formatDate(clinic.approvedAt)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
