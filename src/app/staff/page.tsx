'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffApi, MemberSearchResult, CheckInResponse, OpenVisit } from '@/lib/staff-api';
import CheckInScreen from './components/CheckInScreen';
import TreatmentRoomScreen from './components/TreatmentRoomScreen';
import DischargeScreen from './components/DischargeScreen';

type Screen = 'checkin' | 'treatment' | 'discharge';

export default function StaffDashboardPage() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>('checkin');
  const [searchResult, setSearchResult] = useState<MemberSearchResult | null>(null);
  const [checkInData, setCheckInData] = useState<CheckInResponse | null>(null);
  const [openVisit, setOpenVisit] = useState<OpenVisit | null>(null);

  const handleSearch = async (phoneNumber: string) => {
    try {
      const result = await staffApi.searchMember(phoneNumber);
      setSearchResult(result);
      
      if (result.found && result.active && result.member) {
        // Check if there's an open visit
        const visit = await staffApi.getOpenVisit(result.member.id);
        if (visit) {
          setOpenVisit(visit);
          setCurrentScreen('treatment');
        } else {
          setCurrentScreen('checkin');
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to search member');
    }
  };

  const handleCheckIn = async (phoneNumber: string) => {
    try {
      const result = await staffApi.checkIn(phoneNumber);
      setCheckInData(result);
      setCurrentScreen('treatment');
      
      // Fetch the open visit
      const visit = await staffApi.getOpenVisit(result.member.id);
      if (visit) {
        setOpenVisit(visit);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to check in patient');
    }
  };

  const handleProcedureAdded = async () => {
    if (openVisit) {
      // Refresh the open visit
      const visit = await staffApi.getOpenVisit(openVisit.visit.memberId);
      if (visit) {
        setOpenVisit(visit);
      }
    }
  };

  const handleDischarge = async (visitId: string) => {
    try {
      await staffApi.dischargeVisit(visitId);
      // Reset state and go back to check-in
      setSearchResult(null);
      setCheckInData(null);
      setOpenVisit(null);
      setCurrentScreen('checkin');
      alert('Patient discharged successfully! SMS notification sent.');
    } catch (error: any) {
      alert(error.message || 'Failed to discharge patient');
    }
  };

  return (
    <div className="space-y-6">
      {currentScreen === 'checkin' && (
        <CheckInScreen
          searchResult={searchResult}
          onSearch={handleSearch}
          onCheckIn={handleCheckIn}
        />
      )}

      {currentScreen === 'treatment' && openVisit && (
        <TreatmentRoomScreen
          visit={openVisit}
          onProcedureAdded={handleProcedureAdded}
          onDischarge={() => setCurrentScreen('discharge')}
        />
      )}

      {currentScreen === 'discharge' && openVisit && (
        <DischargeScreen
          visit={openVisit}
          onDischarge={handleDischarge}
          onBack={() => setCurrentScreen('treatment')}
        />
      )}
    </div>
  );
}
