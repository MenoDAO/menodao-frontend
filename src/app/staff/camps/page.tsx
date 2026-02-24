"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { staffApi, Camp } from "@/lib/staff-api";

export default function CampsPage() {
  const router = useRouter();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCamps();
  }, []);

  const loadCamps = async () => {
    try {
      const data = await staffApi.getCamps();
      setCamps(data);
    } catch (error) {
      console.error("Failed to load camps:", error);
      alert("Failed to load camps. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Clinics
        </h1>
        <button
          onClick={() => router.push("/staff/camps/new")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          + Add New Clinic
        </button>
      </div>

      {camps.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            No clinics found. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {camps.map((camp) => (
            <div
              key={camp.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {camp.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    camp.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {camp.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p>
                  <span className="font-semibold">Venue:</span> {camp.venue}
                </p>
                <p>
                  <span className="font-semibold">Dates:</span>{" "}
                  {formatDate(camp.startDate)} - {formatDate(camp.endDate)}
                </p>
                <p>
                  <span className="font-semibold">Capacity:</span>{" "}
                  {camp._count?.registrations || 0} / {camp.capacity}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                <button
                  onClick={() => router.push(`/staff/camps/${camp.id}`)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
