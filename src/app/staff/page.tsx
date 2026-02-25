"use client";

import { useState, useEffect, useCallback } from "react";
import {
  staffApi,
  MemberSearchResult,
  OpenVisit,
  CheckInDto,
} from "@/lib/staff-api";
import CheckInScreen from "./components/CheckInScreen";
import TreatmentRoomScreen from "./components/TreatmentRoomScreen";
import DischargeScreen from "./components/DischargeScreen";

type Screen = "overview" | "checkin" | "treatment" | "discharge";

interface DashboardCamp {
  id: string;
  name: string;
  expectedMembers: number;
  startDate: string;
  venue: string;
}

interface Stats {
  branchMemberCount: number;
  upcomingCamps: DashboardCamp[];
  totalClaimsPending: number;
}

export default function StaffDashboardPage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchResult, setSearchResult] = useState<MemberSearchResult | null>(
    null,
  );

  const [openVisit, setOpenVisit] = useState<OpenVisit | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await staffApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []); // Empty dependency array means this function is stable across re-renders

  useEffect(() => {
    const initStats = async () => {
      if (currentScreen === "overview") {
        await fetchStats();
      }
    };
    initStats();
  }, [currentScreen, fetchStats]); // Added fetchStats to dependencies

  const handleSearch = async (phoneNumber: string) => {
    try {
      const result = await staffApi.searchMember(phoneNumber);
      setSearchResult(result);

      // If member not found or inactive, just show the result on checkin screen
      if (!result.found || !result.active || !result.member) {
        return;
      }

      // Member found and active - check for open visit
      const visit = await staffApi.getOpenVisit(result.member.id);

      if (visit) {
        // Has open visit - go to treatment
        setOpenVisit(visit);
        setCurrentScreen("treatment");
      }
      // If no visit, stay on checkin screen (already there)
    } catch (error: unknown) {
      console.error("Search error:", error);
      alert(error instanceof Error ? error.message : "Failed to search member");
    }
  };

  const handleCheckIn = async (data: CheckInDto) => {
    try {
      const result = await staffApi.checkIn(data);

      // Fetch the open visit
      const visit = await staffApi.getOpenVisit(result.member.id);

      if (!visit) {
        throw new Error("Failed to retrieve visit after check-in");
      }

      setOpenVisit(visit);
      setCurrentScreen("treatment");
    } catch (error: unknown) {
      console.error("Check-in error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to check in patient",
      );
    }
  };

  const handleProcedureAdded = async () => {
    if (openVisit) {
      try {
        // Refresh the open visit
        const visit = await staffApi.getOpenVisit(openVisit.visit.memberId);
        if (visit) {
          setOpenVisit(visit);
        }
      } catch (error) {
        console.error("Failed to refresh visit after procedure:", error);
      }
    }
  };

  const handleDischarge = async (visitId: string) => {
    try {
      await staffApi.dischargeVisit(visitId);
      // Reset state and go back to overview
      setSearchResult(null);
      setOpenVisit(null);
      setCurrentScreen("overview");
      alert("Patient discharged successfully! SMS notification sent.");
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : "Failed to discharge patient",
      );
    }
  };

  return (
    <div className="space-y-6">
      {currentScreen === "overview" && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <button
              onClick={() => setCurrentScreen("checkin")}
              className="bg-emerald-600 text-white py-3 px-8 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
            >
              Start New Check-In
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Branch Members
              </p>
              <p className="text-3xl font-bold text-emerald-600">
                {stats?.branchMemberCount || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Pending Claims
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats?.totalClaimsPending || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Active Staff
              </p>
              <p className="text-3xl font-bold text-green-600">Online</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Upcoming Clinics
            </h2>
            <div className="space-y-4">
              {!stats?.upcomingCamps || stats.upcomingCamps.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No upcoming clinics scheduled
                </p>
              ) : (
                stats.upcomingCamps.map((camp: DashboardCamp) => (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 font-bold">
                        {new Date(camp.startDate).getDate()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{camp.name}</p>
                        <p className="text-sm text-gray-500">{camp.venue}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {camp.expectedMembers}
                      </p>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Registered
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {currentScreen === "checkin" && (
        <CheckInScreen
          searchResult={searchResult}
          onSearch={handleSearch}
          onCheckIn={handleCheckIn}
        />
      )}

      {currentScreen === "treatment" && openVisit && (
        <TreatmentRoomScreen
          visit={openVisit}
          onProcedureAdded={handleProcedureAdded}
          onDischarge={() => setCurrentScreen("discharge")}
        />
      )}

      {currentScreen === "discharge" && openVisit && (
        <DischargeScreen
          visit={openVisit}
          onDischarge={handleDischarge}
          onBack={() => setCurrentScreen("treatment")}
        />
      )}
    </div>
  );
}
