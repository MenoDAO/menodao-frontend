"use client";

import { useState } from "react";

export interface QuestionnaireData {
  // Section 1: Demographics & Consent
  age?: number;
  gender?: string;
  education?: string;
  occupation?: string;
  residenceVillage?: string;
  residenceCounty?: string;
  researchConsent: boolean;

  // Section 2: Medical & Dental History
  lastDentalVisit?: string;
  drugAllergies?: string;
  currentMedications?: string;
  medicalConditions?: string[];
  familyHistory?: string[];

  // Section 3: Current Dental Concerns
  chiefComplaint?: string;
  painLevel?: number;
  recentSymptoms?: string[];

  // Section 4: Oral Hygiene & Lifestyle
  brushingFrequency?: string;
  flossingFrequency?: string;
  sugarIntake?: string;
  smokesTobacco?: boolean;
  alcoholUse?: string;
  substanceUse?: boolean;

  // Section 5: Clinical Examination (Clinician Only)
  oralHygieneIndex?: string;
  softTissueFindings?: string;
  periodontalStatus?: string;
  decayedTeeth?: number;
  missingTeeth?: number;
  filledTeeth?: number;
  dmftScore?: number;
  occlusionStatus?: string;

  // Section 6: Risk Assessment (Clinician Only)
  cariesRisk?: string;
  periodontalRisk?: string;
  oralCancerRisk?: string;

  // Section 7: Patient Satisfaction
  smileSatisfaction?: string;
  careConfidence?: string;
}

interface QuestionnaireFormProps {
  onSubmit: (data: QuestionnaireData) => void;
  onCancel: () => void;
}

export default function QuestionnaireForm({
  onSubmit,
  onCancel,
}: QuestionnaireFormProps) {
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<QuestionnaireData>({
    researchConsent: false,
    smokesTobacco: false,
    substanceUse: false,
  });

  const updateField = (field: keyof QuestionnaireData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof QuestionnaireData, item: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    updateField(field, newArray);
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const nextSection = () => {
    if (currentSection < 7) setCurrentSection(currentSection + 1);
  };

  const prevSection = () => {
    if (currentSection > 1) setCurrentSection(currentSection - 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Comprehensive Dental Check-Up Questionnaire (CDCQ-v1)
        </h2>
        <p className="text-sm text-gray-600">Section {currentSection} of 7</p>
        <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
          <div
            className="bg-blue-600 h-full rounded-full transition-all"
            style={{ width: `${(currentSection / 7) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Demographics & Consent */}
        {currentSection === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Patient Demographics & Consent
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => updateField("age", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender Identity
                </label>
                <select
                  value={formData.gender || ""}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary/Other">Non-binary/Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Level
                </label>
                <select
                  value={formData.education || ""}
                  onChange={(e) => updateField("education", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="Primary School">Primary School</option>
                  <option value="Secondary/High School">
                    Secondary/High School
                  </option>
                  <option value="Trade/Vocational Training">
                    Trade/Vocational Training
                  </option>
                  <option value="University/College Degree">
                    University/College Degree
                  </option>
                  <option value="None">None</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation || ""}
                  onChange={(e) => updateField("occupation", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Teacher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Village/Ward/Estate
                </label>
                <input
                  type="text"
                  value={formData.residenceVillage || ""}
                  onChange={(e) =>
                    updateField("residenceVillage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Kibera"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County/Region
                </label>
                <input
                  type="text"
                  value={formData.residenceCounty || ""}
                  onChange={(e) =>
                    updateField("residenceCounty", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Nairobi"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.researchConsent}
                  onChange={(e) =>
                    updateField("researchConsent", e.target.checked)
                  }
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <div className="text-sm">
                  <p className="font-bold text-gray-900">Research Consent</p>
                  <p className="text-gray-600">
                    I consent to my anonymized data being used for oral health
                    research to improve community care standards.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Section 2: Medical & Dental History */}
        {currentSection === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Medical & Dental History
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When was your last dental visit?
              </label>
              <select
                value={formData.lastDentalVisit || ""}
                onChange={(e) => updateField("lastDentalVisit", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Less than 6 months ago">
                  Less than 6 months ago
                </option>
                <option value="6 – 12 months ago">6 – 12 months ago</option>
                <option value="1 – 2 years ago">1 – 2 years ago</option>
                <option value="More than 2 years ago">
                  More than 2 years ago
                </option>
                <option value="Never">Never</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drug Allergies
              </label>
              <input
                type="text"
                value={formData.drugAllergies || ""}
                onChange={(e) => updateField("drugAllergies", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Penicillin (or 'None')"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Medications
              </label>
              <input
                type="text"
                value={formData.currentMedications || ""}
                onChange={(e) =>
                  updateField("currentMedications", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Metformin, Aspirin (or 'None')"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions (Select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  "Diabetes (Type 1 or 2)",
                  "Hypertension / Heart Disease",
                  "Respiratory Conditions (Asthma, etc.)",
                  "HIV / Immune Compromise",
                  "Pregnancy (Current)",
                  "None of the above",
                ].map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(formData.medicalConditions || []).includes(
                        condition,
                      )}
                      onChange={() =>
                        toggleArrayItem("medicalConditions", condition)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family History (Select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  "Severe Gum Disease (Periodontitis)",
                  "Frequent Tooth Decay",
                  "Oral Cancer",
                  "None / Unknown",
                ].map((history) => (
                  <label
                    key={history}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(formData.familyHistory || []).includes(history)}
                      onChange={() => toggleArrayItem("familyHistory", history)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{history}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Current Dental Concerns */}
        {currentSection === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Current Dental Concerns
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary reason for visit today
              </label>
              <select
                value={formData.chiefComplaint || ""}
                onChange={(e) => updateField("chiefComplaint", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Routine Check-up / Cleaning">
                  Routine Check-up / Cleaning
                </option>
                <option value="Tooth Pain / Discomfort">
                  Tooth Pain / Discomfort
                </option>
                <option value="Broken / Chipped Tooth">
                  Broken / Chipped Tooth
                </option>
                <option value="Bleeding Gums">Bleeding Gums</option>
                <option value="Aesthetic / Appearance Concern">
                  Aesthetic / Appearance Concern
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current oral pain level (0 = No Pain, 10 = Worst Pain)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.painLevel || 0}
                  onChange={(e) =>
                    updateField("painLevel", parseInt(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-blue-600 w-12 text-center">
                  {formData.painLevel || 0}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recent symptoms (Select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  "Sensitivity to Hot/Cold",
                  "Pain when chewing",
                  "Swelling in gums/face",
                  "Dry mouth",
                  "Trauma/Injury to mouth",
                ].map((symptom) => (
                  <label
                    key={symptom}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(formData.recentSymptoms || []).includes(
                        symptom,
                      )}
                      onChange={() =>
                        toggleArrayItem("recentSymptoms", symptom)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{symptom}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Oral Hygiene & Lifestyle */}
        {currentSection === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Oral Hygiene & Lifestyle Habits
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How often do you brush your teeth?
              </label>
              <select
                value={formData.brushingFrequency || ""}
                onChange={(e) =>
                  updateField("brushingFrequency", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Twice a day or more">Twice a day or more</option>
                <option value="Once a day">Once a day</option>
                <option value="Occasionally / Rarely">
                  Occasionally / Rarely
                </option>
                <option value="Never">Never</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How often do you use floss or interdental brushes?
              </label>
              <select
                value={formData.flossingFrequency || ""}
                onChange={(e) =>
                  updateField("flossingFrequency", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Rarely / Never">Rarely / Never</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How often do you consume sugary snacks or drinks?
              </label>
              <select
                value={formData.sugarIntake || ""}
                onChange={(e) => updateField("sugarIntake", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="3+ times per day (High Risk)">
                  3+ times per day (High Risk)
                </option>
                <option value="1-2 times per day (Moderate Risk)">
                  1-2 times per day (Moderate Risk)
                </option>
                <option value="Occasionally / Weekends only (Low Risk)">
                  Occasionally / Weekends only (Low Risk)
                </option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smokesTobacco || false}
                  onChange={(e) =>
                    updateField("smokesTobacco", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  I smoke or use tobacco products
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alcohol consumption
                </label>
                <select
                  value={formData.alcoholUse || ""}
                  onChange={(e) => updateField("alcoholUse", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="Frequent">Frequent</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Never">Never</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.substanceUse || false}
                  onChange={(e) =>
                    updateField("substanceUse", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  I use recreational substances (e.g., Khat/Miraa)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Section 5: Clinical Examination (Clinician Only) */}
        {currentSection === 5 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-bold text-blue-900">
                CLINICIAN ONLY SECTION
              </p>
              <p className="text-xs text-blue-700">
                This section should be completed by the dental clinician during
                examination.
              </p>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Clinical Examination Data
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oral Hygiene Index (Visual Assessment)
              </label>
              <select
                value={formData.oralHygieneIndex || ""}
                onChange={(e) =>
                  updateField("oralHygieneIndex", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Good">Good (Minimal plaque/calculus)</option>
                <option value="Fair">Fair (Moderate localized plaque)</option>
                <option value="Poor">
                  Poor (Generalized heavy plaque/calculus)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soft Tissue / Oral Mucosa Screening
              </label>
              <input
                type="text"
                value={formData.softTissueFindings || ""}
                onChange={(e) =>
                  updateField("softTissueFindings", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., WNL (Within Normal Limits) or describe abnormality"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periodontal Status (BPE - Highest Score)
              </label>
              <select
                value={formData.periodontalStatus || ""}
                onChange={(e) =>
                  updateField("periodontalStatus", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="0">0 (Healthy)</option>
                <option value="1">1 (Bleeding on Probing)</option>
                <option value="2">2 (Calculus/Overhangs)</option>
                <option value="3">3 (Pocket 3.5-5.5mm)</option>
                <option value="4">4 (Pocket &gt;5.5mm)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decayed (D) Teeth
                </label>
                <input
                  type="number"
                  value={formData.decayedTeeth || ""}
                  onChange={(e) =>
                    updateField("decayedTeeth", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Missing (M) Teeth
                </label>
                <input
                  type="number"
                  value={formData.missingTeeth || ""}
                  onChange={(e) =>
                    updateField("missingTeeth", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filled (F) Teeth
                </label>
                <input
                  type="number"
                  value={formData.filledTeeth || ""}
                  onChange={(e) =>
                    updateField("filledTeeth", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-bold text-gray-700">
                DMFT Index Score:{" "}
                {(formData.decayedTeeth || 0) +
                  (formData.missingTeeth || 0) +
                  (formData.filledTeeth || 0)}
              </p>
              <p className="text-xs text-gray-600">
                Auto-calculated from D+M+F
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Functional Analysis (Occlusion)
              </label>
              <select
                value={formData.occlusionStatus || ""}
                onChange={(e) => updateField("occlusionStatus", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Normal Class I">Normal Class I</option>
                <option value="Malocclusion">
                  Malocclusion (Class II / III / Open Bite / Crossbite)
                </option>
                <option value="TMJ Issues">
                  TMJ Issues (Clicking / Pain / Deviation)
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Section 6: Risk Assessment (Clinician Only) */}
        {currentSection === 6 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-bold text-blue-900">
                CLINICIAN ONLY SECTION
              </p>
              <p className="text-xs text-blue-700">
                Risk stratification for preventive interventions and recall
                intervals.
              </p>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Risk Assessment
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caries Risk Assessment (CAMBRA)
              </label>
              <select
                value={formData.cariesRisk || ""}
                onChange={(e) => updateField("cariesRisk", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Low Risk">Low Risk</option>
                <option value="Moderate Risk">Moderate Risk</option>
                <option value="High Risk">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periodontal Risk Assessment
              </label>
              <select
                value={formData.periodontalRisk || ""}
                onChange={(e) => updateField("periodontalRisk", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Low Risk">Low Risk</option>
                <option value="Moderate Risk">Moderate Risk</option>
                <option value="High Risk">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oral Cancer Risk
              </label>
              <select
                value={formData.oralCancerRisk || ""}
                onChange={(e) => updateField("oralCancerRisk", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Low">Low</option>
                <option value="Elevated">
                  Elevated (Requires monitoring/referral)
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Section 7: Patient Satisfaction */}
        {currentSection === 7 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Patient Satisfaction & Behavioral Intentions
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How satisfied are you with the appearance of your teeth/smile?
              </label>
              <select
                value={formData.smileSatisfaction || ""}
                onChange={(e) =>
                  updateField("smileSatisfaction", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Very Satisfied">Very Satisfied</option>
                <option value="Somewhat Satisfied">Somewhat Satisfied</option>
                <option value="Dissatisfied">Dissatisfied</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How confident are you in your ability to follow the
                dentist&apos;s home care advice?
              </label>
              <select
                value={formData.careConfidence || ""}
                onChange={(e) => updateField("careConfidence", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="Very Confident">Very Confident</option>
                <option value="Somewhat Confident">Somewhat Confident</option>
                <option value="Not Confident">Not Confident</option>
              </select>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <p className="text-sm font-bold text-green-900 mb-2">
                ✓ Questionnaire Complete
              </p>
              <p className="text-xs text-green-700">
                Review your responses and click &quot;Submit Questionnaire&quot;
                to proceed with check-in.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Cancel
        </button>

        <div className="flex gap-3">
          {currentSection > 1 && (
            <button
              onClick={prevSection}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Previous
            </button>
          )}

          {currentSection < 7 ? (
            <button
              onClick={nextSection}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Next Section
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Submit Questionnaire
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
