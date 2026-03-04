/**
 * Login Page Tests
 * Tests the login flow including phone number input, OTP verification, and error handling
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../page";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the auth store
const mockRequestOtp = jest.fn();
const mockVerifyOtp = jest.fn();
let mockOtpSent = false;
let mockPhoneNumber = "";

jest.mock("@/lib/auth-store", () => ({
  useAuthStore: Object.assign(
    () => ({
      requestOtp: mockRequestOtp,
      verifyOtp: mockVerifyOtp,
      otpSent: mockOtpSent,
      phoneNumber: mockPhoneNumber,
    }),
    {
      setState: jest.fn((state) => {
        if (state.otpSent !== undefined) mockOtpSent = state.otpSent;
      }),
    },
  ),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOtpSent = false;
    mockPhoneNumber = "";
  });

  describe("Phone Number Form", () => {
    it("renders the phone number form initially", () => {
      render(<LoginPage />);

      expect(screen.getByText("Welcome to MenoDAO")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in or create your account"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("0712345678")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /continue/i }),
      ).toBeInTheDocument();
    });

    it("shows validation error for invalid phone number", async () => {
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "123");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/phone number must be at least 10 digits/i),
        ).toBeInTheDocument();
      });
    });

    it("submits valid phone number and requests OTP", async () => {
      mockRequestOtp.mockResolvedValueOnce(undefined);
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "0712345678");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestOtp).toHaveBeenCalledWith("0712345678");
      });
    });

    it("displays error when OTP request fails", async () => {
      mockRequestOtp.mockRejectedValueOnce(new Error("Network error"));
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "0712345678");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("accepts phone numbers with country code", async () => {
      mockRequestOtp.mockResolvedValueOnce(undefined);
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "+254712345678");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestOtp).toHaveBeenCalledWith("+254712345678");
      });
    });
  });

  describe("OTP Verification Form", () => {
    beforeEach(() => {
      mockOtpSent = true;
      mockPhoneNumber = "0712345678";
    });

    it("renders OTP form when OTP is sent", () => {
      render(<LoginPage />);

      expect(screen.getByText("Enter Verification Code")).toBeInTheDocument();
      expect(
        screen.getByText(/we sent a code to 0712345678/i),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /verify & sign in/i }),
      ).toBeInTheDocument();
    });

    it("shows validation error for invalid OTP", async () => {
      render(<LoginPage />);
      const user = userEvent.setup();

      const otpInput = screen.getByPlaceholderText("123456");
      await user.type(otpInput, "123");

      const submitButton = screen.getByRole("button", {
        name: /verify & sign in/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/otp must be 6 digits/i)).toBeInTheDocument();
      });
    });

    it("submits valid OTP and navigates to dashboard for existing user", async () => {
      mockVerifyOtp.mockResolvedValueOnce(undefined);
      // Mock an existing user with a name
      const { useAuthStore } = require("@/lib/auth-store");
      useAuthStore.getState = jest.fn().mockReturnValue({
        member: { id: "1", phoneNumber: "0712345678", fullName: "Jane Doe" },
      });

      render(<LoginPage />);
      const user = userEvent.setup();

      const otpInput = screen.getByPlaceholderText("123456");
      await user.type(otpInput, "123456");

      const submitButton = screen.getByRole("button", {
        name: /verify & sign in/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("shows profile setup for new user without full name", async () => {
      mockVerifyOtp.mockResolvedValueOnce(undefined);
      // Mock a new user without a name
      const { useAuthStore } = require("@/lib/auth-store");
      useAuthStore.getState = jest.fn().mockReturnValue({
        member: { id: "1", phoneNumber: "0712345678" },
      });

      render(<LoginPage />);
      const user = userEvent.setup();

      const otpInput = screen.getByPlaceholderText("123456");
      await user.type(otpInput, "123456");

      const submitButton = screen.getByRole("button", {
        name: /verify & sign in/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("e.g. Jane Wanjiku"),
        ).toBeInTheDocument();
      });
    });

    it("filters and selects a county in the dropdown", async () => {
      mockVerifyOtp.mockResolvedValueOnce(undefined);
      const { useAuthStore } = require("@/lib/auth-store");
      useAuthStore.getState = jest.fn().mockReturnValue({
        member: { id: "1", phoneNumber: "0712345678" },
      });

      render(<LoginPage />);
      const user = userEvent.setup();

      // Get to profile setup
      const otpInput = screen.getByPlaceholderText("123456");
      await user.type(otpInput, "123456");
      fireEvent.click(
        screen.getByRole("button", { name: /verify & sign in/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
      });

      // Open dropdown
      const dropdownButton = screen.getByRole("button", {
        name: /select your county/i,
      });
      fireEvent.click(dropdownButton);

      // Search for Nairobi
      const searchInput = screen.getByPlaceholderText("Search county...");
      await user.type(searchInput, "Nairobi");

      // Select Nairobi
      const nairobiOption = screen.getByRole("button", { name: /nairobi/i });
      fireEvent.click(nairobiOption);

      // Verify selection
      expect(screen.getByText("Nairobi")).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("Search county..."),
      ).not.toBeInTheDocument();
    });

    it("displays error when OTP verification fails", async () => {
      mockVerifyOtp.mockRejectedValueOnce(new Error("Invalid OTP"));
      render(<LoginPage />);
      const user = userEvent.setup();

      const otpInput = screen.getByPlaceholderText("123456");
      await user.type(otpInput, "123456");

      const submitButton = screen.getByRole("button", {
        name: /verify & sign in/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid OTP")).toBeInTheDocument();
      });
    });

    it("allows user to go back to phone form", () => {
      const { useAuthStore } = require("@/lib/auth-store");
      render(<LoginPage />);

      const backButton = screen.getByText("Use different number");
      fireEvent.click(backButton);

      expect(useAuthStore.setState).toHaveBeenCalledWith({ otpSent: false });
    });
  });

  describe("Loading States", () => {
    it("shows loading spinner during OTP request", async () => {
      mockRequestOtp.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "0712345678");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      // Check button is disabled during loading
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("UI Elements", () => {
    it("displays MenoDAO branding", () => {
      render(<LoginPage />);

      expect(screen.getByText("MenoDAO")).toBeInTheDocument();
      expect(screen.getByText("Member Portal")).toBeInTheDocument();
      expect(screen.getByAltText("MenoDAO")).toBeInTheDocument();
    });

    it("has link to join MenoDAO", () => {
      render(<LoginPage />);

      const joinLink = screen.getByText("Join MenoDAO");
      expect(joinLink).toHaveAttribute("href", "https://menodao.org");
    });

    it("displays security message", () => {
      render(<LoginPage />);

      expect(
        screen.getByText(/secure\. transparent\. community owned\./i),
      ).toBeInTheDocument();
    });
  });
});
