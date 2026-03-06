"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStaffStore } from "@/lib/staff-store";
import { staffApi } from "@/lib/staff-api";
import { Menu, X } from "lucide-react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, staff, logout } = useStaffStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <div className="shrink-0 flex items-center">
                <h1
                  className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer"
                  onClick={() => router.push("/staff")}
                >
                  MenoDAO Staff
                </h1>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
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
                  onClick={() => router.push("/staff/history")}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${
                    pathname?.startsWith("/staff/history")
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300"
                  }`}
                >
                  History
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
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                {staff?.fullName}
              </span>
              <button
                onClick={() => {
                  logout();
                  staffApi.setToken(null);
                  router.push("/staff/login");
                }}
                className="hidden sm:block text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <a
                onClick={() => {
                  router.push("/staff");
                  setMobileMenuOpen(false);
                }}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer ${
                  pathname === "/staff"
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Check-In
              </a>
              <a
                onClick={() => {
                  router.push("/staff/camps");
                  setMobileMenuOpen(false);
                }}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer ${
                  pathname?.startsWith("/staff/camps")
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Clinics
              </a>
              <a
                onClick={() => {
                  router.push("/staff/history");
                  setMobileMenuOpen(false);
                }}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer ${
                  pathname?.startsWith("/staff/history")
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                History
              </a>
              <a
                onClick={() => {
                  router.push("/staff/claims");
                  setMobileMenuOpen(false);
                }}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer ${
                  pathname?.startsWith("/staff/claims")
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Claims
              </a>
              <a
                onClick={() => {
                  router.push("/staff/communication");
                  setMobileMenuOpen(false);
                }}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer ${
                  pathname?.startsWith("/staff/communication")
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Communication
              </a>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-4">
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-800 dark:text-white">
                    {staff?.fullName}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {staff?.username}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    logout();
                    staffApi.setToken(null);
                    router.push("/staff/login");
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-gray-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
