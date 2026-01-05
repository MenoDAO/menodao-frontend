import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, Member } from './api';

interface AuthState {
  member: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  phoneNumber: string | null;
  otpSent: boolean;

  // Actions
  setPhoneNumber: (phone: string) => void;
  requestOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateMember: (member: Member) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      member: null,
      isAuthenticated: false,
      isLoading: true,
      phoneNumber: null,
      otpSent: false,

      setPhoneNumber: (phone) => set({ phoneNumber: phone }),

      requestOtp: async (phoneNumber: string) => {
        await api.requestOtp(phoneNumber);
        set({ phoneNumber, otpSent: true });
      },

      verifyOtp: async (code: string) => {
        const phone = get().phoneNumber;
        if (!phone) throw new Error('Phone number not set');

        const { accessToken, member } = await api.verifyOtp(phone, code);
        api.setToken(accessToken);
        set({
          member,
          isAuthenticated: true,
          otpSent: false,
        });
      },

      logout: () => {
        api.setToken(null);
        set({
          member: null,
          isAuthenticated: false,
          phoneNumber: null,
          otpSent: false,
        });
      },

      loadUser: async () => {
        set({ isLoading: true });
        try {
          const token = api.getToken();
          if (!token) {
            set({ isLoading: false });
            return;
          }

          const member = await api.getMe();
          set({
            member,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          api.setToken(null);
          set({
            member: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateMember: (member) => set({ member }),
    }),
    {
      name: 'menodao-auth',
      partialize: (state) => ({
        // Only persist these fields
        member: state.member,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
