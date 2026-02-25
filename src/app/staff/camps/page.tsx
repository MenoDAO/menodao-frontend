"use client";

import { useState, useEffect, useCallback } from "react";
import { staffApi, Clinic } from "@/lib/staff-api";

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const loadClinics = useCallback(async () => {
    try {
      const data = await staffApi.getClinics();
      setClinics(data);
    } catch (error) {
      console.error("Failed to load clinics:", error);
      alert("Failed to load clinics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const blurText = (text: string) => {
    return text
      .split("")
      .map((char, i) =>
        char === " " || char === "@" || char === "." ? char : "•",
      )
      .join("");
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
        <h1 className="text-2xl font-bold text-gray-900">Partner Clinics</h1>
        <button
          onClick={() => window.open("/register-clinic", "_blank")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          + Register New Clinic
        </button>
      </div>

      <p className="text-sm text-gray-600">
        Showing approved partner clinics. Click on a clinic to view full contact
        details.
      </p>

      {clinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No approved clinics found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => {
            const isSelected = selectedClinicId === clinic.id;

            return (
              <div
                key={clinic.id}
                onClick={() =>
                  setSelectedClinicId(isSelected ? null : clinic.id)
                }
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 cursor-pointer ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {clinic.name}
                  </h3>
                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <span className="font-semibold">Location:</span>{" "}
                    {clinic.physicalLocation}, {clinic.subCounty}
                  </p>
                  <p>
                    <span className="font-semibold">Lead Dentist:</span>{" "}
                    {isSelected
                      ? clinic.leadDentistName
                      : blurText(clinic.leadDentistName)}
                  </p>
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {isSelected
                      ? clinic.ownerPhone
                      : blurText(clinic.ownerPhone)}
                  </p>
                  <p>
                    <span className="font-semibold">WhatsApp:</span>{" "}
                    {isSelected
                      ? clinic.whatsappNumber
                      : blurText(clinic.whatsappNumber)}
                  </p>
                  {clinic.email && (
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {isSelected ? clinic.email : blurText(clinic.email)}
                    </p>
                  )}
                  {clinic.approvedAt && (
                    <p className="text-xs text-gray-500 mt-3">
                      Approved: {formatDate(clinic.approvedAt)}
                    </p>
                  )}
                </div>

                {!isSelected && (
                  <p className="text-xs text-blue-600 font-medium">
                    Click to view contact details
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
