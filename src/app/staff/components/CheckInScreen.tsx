'use client';

import { useState } from 'react';
import { MemberSearchResult } from '@/lib/staff-api';

interface CheckInScreenProps {
  searchResult: MemberSearchResult | null;
  onSearch: (phoneNumber: string) => void;
  onCheckIn: (phoneNumber: string) => void;
}

export default function CheckInScreen({ searchResult, onSearch, onCheckIn }: CheckInScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    try {
      await onSearch(phoneNumber);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'GOLD':
        return 'bg-yellow-500 text-yellow-900';
      case 'SILVER':
        return 'bg-gray-400 text-gray-900';
      case 'BRONZE':
        return 'bg-orange-600 text-orange-100';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Front Desk - Patient Check-In
      </h2>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter patient phone number (0XXXXXXXXX)"
            className="flex-1 px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searchResult && (
        <div className="mt-6">
          {!searchResult.found ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 font-semibold">
                Member not found
              </p>
              <p className="text-red-600 dark:text-red-500 text-sm mt-1">
                Please verify the phone number or ask the patient to register.
              </p>
            </div>
          ) : !searchResult.active ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <p className="text-yellow-800 dark:text-yellow-300 font-semibold text-lg mb-2">
                No Active Subscription
              </p>
              <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                Patient: {searchResult.member?.fullName || 'N/A'}
              </p>
              <button
                onClick={() => window.open('https://app.menodao.org', '_blank')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
              >
                Subscribe Now
              </button>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {searchResult.member?.fullName || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {searchResult.member?.phoneNumber}
                  </p>
                </div>
                {searchResult.member?.tier && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierBadgeColor(
                      searchResult.member.tier
                    )}`}
                  >
                    {searchResult.member.tier}
                  </span>
                )}
              </div>

              {searchResult.claimLimit && (
                <div className="mb-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Claim Limit
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    KES {searchResult.claimLimit.remaining.toLocaleString()} Available
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used: KES {searchResult.claimLimit.used.toLocaleString()} / KES{' '}
                    {searchResult.claimLimit.allocated.toLocaleString()}
                  </p>
                </div>
              )}

              <button
                onClick={() => onCheckIn(phoneNumber)}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                CHECK-IN PATIENT
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
