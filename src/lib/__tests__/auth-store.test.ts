/**
 * Auth Store Tests
 * Tests the Zustand authentication store functionality
 */

// Mock the api module
jest.mock('../api', () => ({
  api: {
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    setToken: jest.fn(),
    getToken: jest.fn(),
    getMe: jest.fn(),
  },
}));

// Import after mocking
import { useAuthStore } from '../auth-store';
import { api } from '../api';

const mockApi = api as jest.Mocked<typeof api>;

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset the store state
    useAuthStore.setState({
      member: null,
      isAuthenticated: false,
      isLoading: true,
      phoneNumber: null,
      otpSent: false,
    });
    
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have member as null initially', () => {
      const state = useAuthStore.getState();
      expect(state.member).toBeNull();
    });

    it('should have isAuthenticated as false initially', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should have phoneNumber as null initially', () => {
      const state = useAuthStore.getState();
      expect(state.phoneNumber).toBeNull();
    });

    it('should have otpSent as false initially', () => {
      const state = useAuthStore.getState();
      expect(state.otpSent).toBe(false);
    });
  });

  describe('setPhoneNumber', () => {
    it('should update phone number', () => {
      useAuthStore.getState().setPhoneNumber('+254712345678');

      expect(useAuthStore.getState().phoneNumber).toBe('+254712345678');
    });

    it('should allow updating to different phone number', () => {
      useAuthStore.getState().setPhoneNumber('+254700000000');
      useAuthStore.getState().setPhoneNumber('+254711111111');

      expect(useAuthStore.getState().phoneNumber).toBe('+254711111111');
    });
  });

  describe('requestOtp', () => {
    it('should call api.requestOtp with phone number', async () => {
      mockApi.requestOtp.mockResolvedValue({ message: 'OTP sent' });

      await useAuthStore.getState().requestOtp('+254712345678');

      expect(mockApi.requestOtp).toHaveBeenCalledWith('+254712345678');
    });

    it('should set phoneNumber in state', async () => {
      mockApi.requestOtp.mockResolvedValue({ message: 'OTP sent' });

      await useAuthStore.getState().requestOtp('+254712345678');

      expect(useAuthStore.getState().phoneNumber).toBe('+254712345678');
    });

    it('should set otpSent to true', async () => {
      mockApi.requestOtp.mockResolvedValue({ message: 'OTP sent' });

      await useAuthStore.getState().requestOtp('+254712345678');

      expect(useAuthStore.getState().otpSent).toBe(true);
    });

    it('should throw error if api call fails', async () => {
      mockApi.requestOtp.mockRejectedValue(new Error('Network error'));

      await expect(
        useAuthStore.getState().requestOtp('+254712345678'),
      ).rejects.toThrow('Network error');
    });

    it('should not update state if api call fails', async () => {
      mockApi.requestOtp.mockRejectedValue(new Error('Network error'));

      try {
        await useAuthStore.getState().requestOtp('+254712345678');
      } catch {
        // Ignore error
      }

      expect(useAuthStore.getState().otpSent).toBe(false);
    });
  });

  describe('verifyOtp', () => {
    beforeEach(() => {
      useAuthStore.setState({ phoneNumber: '+254712345678' });
    });

    it('should throw if phone number not set', async () => {
      useAuthStore.setState({ phoneNumber: null });

      await expect(useAuthStore.getState().verifyOtp('123456')).rejects.toThrow(
        'Phone number not set',
      );
    });

    it('should call api.verifyOtp with phone and code', async () => {
      const mockResponse = {
        accessToken: 'jwt-token',
        member: { id: '1', phoneNumber: '+254712345678', isVerified: true },
      };
      mockApi.verifyOtp.mockResolvedValue(mockResponse as any);

      await useAuthStore.getState().verifyOtp('123456');

      expect(mockApi.verifyOtp).toHaveBeenCalledWith('+254712345678', '123456');
    });

    it('should set token on success', async () => {
      const mockMember = { id: '1', phoneNumber: '+254712345678', isVerified: true };
      mockApi.verifyOtp.mockResolvedValue({
        accessToken: 'jwt-token',
        member: mockMember,
      } as any);

      await useAuthStore.getState().verifyOtp('123456');

      expect(mockApi.setToken).toHaveBeenCalledWith('jwt-token');
    });

    it('should update member in state', async () => {
      const mockMember = { id: '1', phoneNumber: '+254712345678', isVerified: true };
      mockApi.verifyOtp.mockResolvedValue({
        accessToken: 'jwt-token',
        member: mockMember,
      } as any);

      await useAuthStore.getState().verifyOtp('123456');

      expect(useAuthStore.getState().member).toEqual(mockMember);
    });

    it('should set isAuthenticated to true', async () => {
      mockApi.verifyOtp.mockResolvedValue({
        accessToken: 'jwt-token',
        member: { id: '1' },
      } as any);

      await useAuthStore.getState().verifyOtp('123456');

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should set otpSent to false', async () => {
      useAuthStore.setState({ otpSent: true });
      mockApi.verifyOtp.mockResolvedValue({
        accessToken: 'jwt-token',
        member: { id: '1' },
      } as any);

      await useAuthStore.getState().verifyOtp('123456');

      expect(useAuthStore.getState().otpSent).toBe(false);
    });

    it('should throw error if verification fails', async () => {
      mockApi.verifyOtp.mockRejectedValue(new Error('Invalid OTP'));

      await expect(useAuthStore.getState().verifyOtp('123456')).rejects.toThrow(
        'Invalid OTP',
      );
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      useAuthStore.setState({
        member: { id: '1', phoneNumber: '+254712345678' } as any,
        isAuthenticated: true,
        phoneNumber: '+254712345678',
        otpSent: false,
      });
    });

    it('should clear token', () => {
      useAuthStore.getState().logout();

      expect(mockApi.setToken).toHaveBeenCalledWith(null);
    });

    it('should set member to null', () => {
      useAuthStore.getState().logout();

      expect(useAuthStore.getState().member).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should clear phoneNumber', () => {
      useAuthStore.getState().logout();

      expect(useAuthStore.getState().phoneNumber).toBeNull();
    });

    it('should set otpSent to false', () => {
      useAuthStore.setState({ otpSent: true });
      useAuthStore.getState().logout();

      expect(useAuthStore.getState().otpSent).toBe(false);
    });
  });

  describe('loadUser', () => {
    it('should set isLoading to false when no token', async () => {
      mockApi.getToken.mockReturnValue(null);

      await useAuthStore.getState().loadUser();

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should not call getMe if no token', async () => {
      mockApi.getToken.mockReturnValue(null);

      await useAuthStore.getState().loadUser();

      expect(mockApi.getMe).not.toHaveBeenCalled();
    });

    it('should call getMe if token exists', async () => {
      const mockMember = { id: '1', phoneNumber: '+254712345678' };
      mockApi.getToken.mockReturnValue('jwt-token');
      mockApi.getMe.mockResolvedValue(mockMember as any);

      await useAuthStore.getState().loadUser();

      expect(mockApi.getMe).toHaveBeenCalled();
    });

    it('should set member from getMe response', async () => {
      const mockMember = { id: '1', phoneNumber: '+254712345678' };
      mockApi.getToken.mockReturnValue('jwt-token');
      mockApi.getMe.mockResolvedValue(mockMember as any);

      await useAuthStore.getState().loadUser();

      expect(useAuthStore.getState().member).toEqual(mockMember);
    });

    it('should set isAuthenticated to true on success', async () => {
      mockApi.getToken.mockReturnValue('jwt-token');
      mockApi.getMe.mockResolvedValue({ id: '1' } as any);

      await useAuthStore.getState().loadUser();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should clear token on getMe failure', async () => {
      mockApi.getToken.mockReturnValue('invalid-token');
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().loadUser();

      expect(mockApi.setToken).toHaveBeenCalledWith(null);
    });

    it('should reset auth state on getMe failure', async () => {
      useAuthStore.setState({
        member: { id: '1' } as any,
        isAuthenticated: true,
      });
      mockApi.getToken.mockReturnValue('invalid-token');
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().loadUser();

      expect(useAuthStore.getState().member).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateMember', () => {
    it('should update member in state', () => {
      const member = {
        id: '1',
        phoneNumber: '+254712345678',
        fullName: 'Test User',
        isVerified: true,
      } as any;

      useAuthStore.getState().updateMember(member);

      expect(useAuthStore.getState().member).toEqual(member);
    });

    it('should allow updating member details', () => {
      const member1 = { id: '1', fullName: 'Old Name' } as any;
      const member2 = { id: '1', fullName: 'New Name' } as any;

      useAuthStore.getState().updateMember(member1);
      useAuthStore.getState().updateMember(member2);

      expect(useAuthStore.getState().member?.fullName).toBe('New Name');
    });
  });
});
