"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dev.menodao.org";

type XRayCapability = "NONE" | "PERIAPICAL" | "OPG";

interface FormData {
  // Section 1
  name: string;
  subCounty: string;
  physicalLocation: string;
  googleMapsLink: string;
  operatingHours: string;
  operatesOnWeekends: boolean;
  // Section 2
  leadDentistName: string;
  ownerPhone: string;
  managerName: string;
  whatsappNumber: string;
  email: string;
  // Section 3
  mpesaTillOrPaybill: string;
  tillPaybillName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  // Section 4
  kmpdcRegNumber: string;
  activeDentalChairs: number;
  xrayCapability: XRayCapability;
  specializedServices: string[];
  // Section 5
  agreedToRateCard: boolean;
  agreedToNoChargePolicy: boolean;
}

const INITIAL: FormData = {
  name: "",
  subCounty: "",
  physicalLocation: "",
  googleMapsLink: "",
  operatingHours: "",
  operatesOnWeekends: false,
  leadDentistName: "",
  ownerPhone: "",
  managerName: "",
  whatsappNumber: "",
  email: "",
  mpesaTillOrPaybill: "",
  tillPaybillName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  kmpdcRegNumber: "",
  activeDentalChairs: 1,
  xrayCapability: "NONE",
  specializedServices: [],
  agreedToRateCard: false,
  agreedToNoChargePolicy: false,
};

const SPECIALIZED_OPTIONS = [
  { value: "ORTHODONTIST", label: "Orthodontist" },
  { value: "MAXILLOFACIAL", label: "Maxillofacial Surgeon" },
  { value: "PEDIATRIC", label: "Pediatric Dentist" },
];

export default function RegisterClinicPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setForm((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      specializedServices: prev.specializedServices.includes(service)
        ? prev.specializedServices.filter((s) => s !== service)
        : [...prev.specializedServices, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/clinics/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-800 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white/10 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/20">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Registration Submitted!
          </h2>
          <p className="text-emerald-200/80 leading-relaxed mb-6">
            Thank you for registering as a MenoDAO Partner Clinic. Our team will
            review your application and contact you once approved. You will
            receive your staff login credentials via SMS.
          </p>
          <a
            href="https://menodao.org"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
          >
            Return to MenoDAO
          </a>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all";
  const labelClass = "block text-sm font-medium text-emerald-200/80 mb-1.5";
  const sectionClass =
    "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-800">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            MenoDAO Partner Clinic
          </h1>
          <p className="text-xl text-emerald-200/70">
            Registration &amp; Onboarding Form
          </p>
          <p className="text-emerald-200/50 mt-2 max-w-xl mx-auto">
            Welcome to Kenya&apos;s first digital health Chama. Please provide
            the following details to officially list your facility as a MenoDAO
            Clinical Hub.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Clinic Details */}
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                1
              </span>
              Clinic Details
            </h2>
            <div>
              <label className={labelClass}>Official Clinic Name *</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. Mombasa Dental Care"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Sub-County / Area *</label>
                <input
                  type="text"
                  name="subCounty"
                  required
                  value={form.subCounty}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Kisauni, Mvita"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Physical Location / Landmark *
                </label>
                <input
                  type="text"
                  name="physicalLocation"
                  required
                  value={form.physicalLocation}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Opposite Nyali Mall"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Google Maps Pin Link</label>
              <input
                type="url"
                name="googleMapsLink"
                value={form.googleMapsLink}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Standard Operating Hours *</label>
                <input
                  type="text"
                  name="operatingHours"
                  required
                  value={form.operatingHours}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Mon-Sat, 8 AM - 6 PM"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="operatesOnWeekends"
                    checked={form.operatesOnWeekends}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <span className="text-sm text-emerald-200/80">
                    Operates on Sundays / Holidays
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                2
              </span>
              Contact Information
            </h2>
            <p className="text-sm text-emerald-200/50 -mt-3">
              We need both the business owner and the front desk contact.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Name of Lead Dentist / Owner *
                </label>
                <input
                  type="text"
                  name="leadDentistName"
                  required
                  value={form.leadDentistName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Dr. Jane Mwangi"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Owner&apos;s Phone Number *
                </label>
                <input
                  type="tel"
                  name="ownerPhone"
                  required
                  value={form.ownerPhone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0712345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Clinic Manager / Receptionist
                </label>
                <input
                  type="text"
                  name="managerName"
                  value={form.managerName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Mary Otieno"
                />
              </div>
              <div>
                <label className={labelClass}>Official WhatsApp Number *</label>
                <input
                  type="tel"
                  name="whatsappNumber"
                  required
                  value={form.whatsappNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0712345678"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Clinic Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="clinic@example.com"
              />
            </div>
          </div>

          {/* Section 3: Payment & Settlement */}
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                3
              </span>
              Payment &amp; Settlement Details
            </h2>
            <p className="text-sm text-emerald-200/50 -mt-3">
              MenoDAO settles payments instantly via our automated API.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>M-Pesa Till / Paybill *</label>
                <input
                  type="text"
                  name="mpesaTillOrPaybill"
                  required
                  value={form.mpesaTillOrPaybill}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="123456"
                />
              </div>
              <div>
                <label className={labelClass}>Name on Till / Paybill *</label>
                <input
                  type="text"
                  name="tillPaybillName"
                  required
                  value={form.tillPaybillName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Mombasa Dental Care"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Alternative Bank Account Name
                </label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={form.bankAccountName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Mombasa Dental Care Ltd"
                />
              </div>
              <div>
                <label className={labelClass}>Bank &amp; Account Number</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={form.bankAccountNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="KCB 1234567890"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Capacity */}
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                4
              </span>
              Clinical Capacity &amp; Compliance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>KMPDC Registration Number</label>
                <input
                  type="text"
                  name="kmpdcRegNumber"
                  value={form.kmpdcRegNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="KMPDC/12345"
                />
              </div>
              <div>
                <label className={labelClass}>Active Dental Chairs *</label>
                <input
                  type="number"
                  name="activeDentalChairs"
                  required
                  min="1"
                  value={form.activeDentalChairs}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Dental X-Ray Services</label>
              <select
                name="xrayCapability"
                value={form.xrayCapability}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="NONE">None</option>
                <option value="PERIAPICAL">Periapical (Small)</option>
                <option value="OPG">OPG (Full Mouth)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Specialized Services on Call</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {SPECIALIZED_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      form.specializedServices.includes(opt.value)
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.specializedServices.includes(opt.value)}
                      onChange={() => toggleService(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Agreement */}
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                5
              </span>
              MenoDAO Agreement
            </h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreedToRateCard"
                checked={form.agreedToRateCard}
                onChange={handleChange}
                required
                className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
              />
              <span className="text-sm text-emerald-200/80 leading-relaxed">
                We have received and agree to the 2026 MenoDAO Pilot Phase Rate
                Card (e.g., KSh 1,000 for Simple Extraction, KSh 3,000 for
                Composite Filling).
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreedToNoChargePolicy"
                checked={form.agreedToNoChargePolicy}
                onChange={handleChange}
                required
                className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
              />
              <span className="text-sm text-emerald-200/80 leading-relaxed">
                We understand that MenoDAO patients are pre-paid and we will not
                charge them out-of-pocket for procedures covered under their
                Chama protocol.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={
                loading ||
                !form.agreedToRateCard ||
                !form.agreedToNoChargePolicy
              }
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </div>

          <p className="text-center text-xs text-emerald-200/30">
            By submitting, you authorize MenoDAO to review and process your
            clinic registration.
          </p>
        </form>
      </div>
    </div>
  );
}
