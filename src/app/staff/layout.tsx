'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStaffStore } from '@/lib/staff-store';
import { staffApi } from '@/lib/staff-api';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, staff, logout } = useStaffStore();

  useEffect(() => {
    // Check authentication on mount and route changes
    if (!isAuthenticated && pathname !== '/staff/login') {
      router.push('/staff/login');
    } else if (isAuthenticated && pathname === '/staff/login') {
      router.push('/staff');
    }

    // Verify token is still valid
    if (isAuthenticated && staffApi.getToken()) {
      staffApi.getProfile().catch(() => {
        logout();
        router.push('/staff/login');
      });
    }
  }, [isAuthenticated, pathname, router, logout]);

  if (!isAuthenticated && pathname !== '/staff/login') {
    return null;
  }

  if (pathname === '/staff/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                MenoDAO Staff Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {staff?.fullName}
              </span>
              <button
                onClick={() => {
                  logout();
                  staffApi.setToken(null);
                  router.push('/staff/login');
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
