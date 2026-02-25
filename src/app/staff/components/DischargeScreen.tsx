'use client';

import { useState } from 'react';
import { OpenVisit, staffApi } from '@/lib/staff-api';

interface DischargeScreenProps {
  visit: OpenVisit;
  onDischarge: (visitId: string) => void;
  onBack: () => void;
}

export default function DischargeScreen({
  visit,
  onDischarge,
  onBack,
}: DischargeScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleDischarge = async () => {
    if (!confirm('Are you sure you want to discharge this patient? This will close the visit and send an SMS notification.')) {
      return;
    }

    setLoading(true);
    try {
      await onDischarge(visit.visit.id);
    } catch (error: any) {
      alert(error.message || 'Failed to discharge patient');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = visit.visit.procedures.reduce((sum, vp) => sum + vp.cost, 0);
  const newRemainingLimit = visit.remainingLimit;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Discharge Patient
      </h2>

      <div className="mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Patient
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {visit.member.fullName || visit.member.phoneNumber}
          </p>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Procedures Summary
        </h3>
        <div className="space-y-2 mb-4">
          {visit.visit.procedures.map((vp) => (
            <div
              key={vp.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {vp.procedure.name}
                </p>
                {vp.procedure.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {vp.procedure.description}
                  </p>
                )}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                KES {vp.cost.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Cost:
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              KES {totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            New Balance After Discharge
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            KES {newRemainingLimit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Back to Treatment
        </button>
        <button
          onClick={handleDischarge}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Discharging...' : 'DISCHARGE PATIENT'}
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
        An SMS notification will be sent to the patient upon discharge.
      </p>
    </div>
  );
}
