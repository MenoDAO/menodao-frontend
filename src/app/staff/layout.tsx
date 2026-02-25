"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStaffStore } from "@/lib/staff-store";
import { staffApi } from "@/lib/staff-api";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, staff, logout } = useStaffStore();

  useEffect(() => {
    // Check authentication on mount and route changes
    if (!isAuthenticated && pathname !== "/staff/login") {
      router.push("/staff/login");
      return;
    } else if (isAuthenticated && pathname === "/staff/login") {
      router.push("/staff");
      return;
    }

    // Verify token is still valid only on mount, not on every route change
    if (isAuthenticated && staffApi.getToken() && pathname !== "/staff/login") {
      staffApi.getProfile().catch((error) => {
        console.error("Token validation failed:", error);
        logout();
        router.push("/staff/login");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pathname]);

  if (!isAuthenticated && pathname !== "/staff/login") {
    return null;
  }

  if (pathname === "/staff/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1
                  className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer"
                  onClick={() => router.push("/staff")}
                >
                  MenoDAO Staff
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  onClick={() => router.push("/staff")}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${
                    pathname === "/staff"
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Check-In
                </a>
                <a
                  onClick={() => router.push("/staff/camps")}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${
                    pathname?.startsWith("/staff/camps")
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Clinics
                </a>
                <a
                  onClick={() => router.push("/staff/claims")}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${
                    pathname?.startsWith("/staff/claims")
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Claims
                </a>
                <a
                  onClick={() => router.push("/staff/communication")}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${
                    pathname?.startsWith("/staff/communication")
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Communication
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {staff?.fullName}
              </span>
              <button
                onClick={() => {
                  logout();
                  staffApi.setToken(null);
                  router.push("/staff/login");
                }}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
