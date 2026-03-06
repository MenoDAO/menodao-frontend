/**
 * API Client Tests
 * Tests the API client functionality including authentication, request handling, and error management
 */

// Mock the module before importing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Reset modules to get fresh API instance for each test
beforeEach(() => {
  jest.resetModules();
  mockFetch.mockReset();
  // Mock localStorage
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

describe("API Client", () => {
  describe("Initialization", () => {
    it("should create API client instance", async () => {
      const { api } = await import("../api");
      expect(api).toBeDefined();
    });

    it("should use NEXT_PUBLIC_API_URL when set", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://custom-api.example.com";
      jest.resetModules();
      const { api } = await import("../api");
      expect(api).toBeDefined();
      delete process.env.NEXT_PUBLIC_API_URL;
    });
  });

  describe("Authentication", () => {
    it("should request OTP successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "OTP sent successfully" }),
      });

      const { api } = await import("../api");
      const result = await api.requestOtp("+254700000000");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/request-otp"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            phoneNumber: "+254700000000",
            createIfNotExists: false,
          }),
        }),
      );
      expect(result.message).toBe("OTP sent successfully");
    });

    it("should verify OTP and return token", async () => {
      const mockResponse = {
        accessToken: "mock-jwt-token",
        member: { id: "1", phoneNumber: "+254700000000", isVerified: true },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { api } = await import("../api");
      const result = await api.verifyOtp("+254700000000", "123456");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/verify-otp"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            phoneNumber: "+254700000000",
            code: "123456",
          }),
        }),
      );
      expect(result.accessToken).toBe("mock-jwt-token");
    });

    it("should handle authentication errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid OTP" }),
      });

      const { api } = await import("../api");

      await expect(
        api.verifyOtp("+254700000000", "wrong-code"),
      ).rejects.toThrow("Invalid OTP");
    });
  });

  describe("Token Management", () => {
    it("should set and get token", async () => {
      const { api } = await import("../api");

      api.setToken("test-token");
      expect(api.getToken()).toBe("test-token");
    });

    it("should include token in Authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "1", phoneNumber: "+254700000000" }),
      });

      const { api } = await import("../api");
      api.setToken("test-token");

      await api.getMe();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });
  });

  describe("Member Endpoints", () => {
    it("should fetch member profile", async () => {
      const mockProfile = {
        id: "1",
        phoneNumber: "+254700000000",
        fullName: "Test User",
        contributions: [],
        claims: [],
        nfts: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const { api } = await import("../api");
      api.setToken("test-token");
      const result = await api.getProfile();

      expect(result).toEqual(mockProfile);
    });

    it("should update member profile", async () => {
      const updatedMember = {
        id: "1",
        phoneNumber: "+254700000000",
        fullName: "Updated Name",
        location: "Nairobi",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedMember,
      });

      const { api } = await import("../api");
      api.setToken("test-token");
      const result = await api.updateProfile({
        fullName: "Updated Name",
        location: "Nairobi",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/members/profile"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            fullName: "Updated Name",
            location: "Nairobi",
          }),
        }),
      );
      expect(result.fullName).toBe("Updated Name");
    });
  });

  describe("Subscription Endpoints", () => {
    it("should fetch subscription packages", async () => {
      const mockPackages = [
        { tier: "BRONZE", monthlyPrice: 500, benefits: ["Benefit 1"] },
        {
          tier: "SILVER",
          monthlyPrice: 1000,
          benefits: ["Benefit 1", "Benefit 2"],
        },
        {
          tier: "GOLD",
          monthlyPrice: 2000,
          benefits: ["Benefit 1", "Benefit 2", "Benefit 3"],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackages,
      });

      const { api } = await import("../api");
      const result = await api.getPackages();

      expect(result).toHaveLength(3);
      expect(result[0].tier).toBe("BRONZE");
    });

    it("should subscribe to a package", async () => {
      const mockSubscription = {
        id: "1",
        tier: "SILVER",
        monthlyAmount: 1000,
        startDate: "2026-01-01",
        isActive: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      });

      const { api } = await import("../api");
      api.setToken("test-token");
      const result = await api.subscribe("SILVER");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/subscriptions/subscribe"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ tier: "SILVER" }),
        }),
      );
      expect(result.tier).toBe("SILVER");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { api } = await import("../api");

      await expect(api.getPackages()).rejects.toThrow("Network error");
    });

    it("should handle server errors with default message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const { api } = await import("../api");

      await expect(api.getPackages()).rejects.toThrow("Request failed");
    });
  });
});
