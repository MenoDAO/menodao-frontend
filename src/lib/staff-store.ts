import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Staff } from './staff-api';

interface StaffState {
  staff: Staff | null;
  token: string | null;
  isAuthenticated: boolean;
  setStaff: (staff: Staff | null, token: string | null) => void;
  logout: () => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set) => ({
      staff: null,
      token: null,
      isAuthenticated: false,
      setStaff: (staff, token) => {
        set({ staff, token, isAuthenticated: !!staff && !!token });
      },
      logout: () => {
        set({ staff: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('staffToken');
        }
      },
    }),
    {
      name: 'staff-storage',
    }
  )
);
