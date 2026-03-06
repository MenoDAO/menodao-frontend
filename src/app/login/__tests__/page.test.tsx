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

// Mock the API
jest.mock("@/lib/api", () => ({
  api: {
    checkPhoneExists: jest.fn(),
    requestOtp: jest.fn(),
  },
}));

// Import the mocked API to access the mock functions
import { api } from "@/lib/api";
const mockCheckPhoneExists = api.checkPhoneExists as jest.Mock;
const mockRequestOtp = api.requestOtp as jest.Mock;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Phone Number Form", () => {
    it("renders the phone number form initially", () => {
      render(<LoginPage />);

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(
        screen.getByText("Enter your phone number to continue"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("0712345678")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /continue/i }),
      ).toBeInTheDocument();
    });

    it("shows error for non-existent phone number", async () => {
      mockCheckPhoneExists.mockResolvedValueOnce({
        exists: false,
        phoneNumber: "+254712345678",
      });
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "0712345678");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Phone number not found. Please sign up instead"),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /sign up/i }),
        ).toBeInTheDocument();
      });
    });

    it("sends OTP for existing phone number", async () => {
      mockCheckPhoneExists.mockResolvedValueOnce({
        exists: true,
        phoneNumber: "+254712345678",
      });
      mockRequestOtp.mockResolvedValueOnce({
        message: "OTP sent successfully",
      });
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "0712345678");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCheckPhoneExists).toHaveBeenCalledWith("+254712345678");
        expect(mockRequestOtp).toHaveBeenCalledWith("+254712345678", false);
        expect(mockPush).toHaveBeenCalledWith(
          "/verify-otp?flow=login&phone=%2B254712345678",
        );
      });
    });

    it("displays error when phone check fails", async () => {
      mockCheckPhoneExists.mockRejectedValueOnce(new Error("Network error"));
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
      mockCheckPhoneExists.mockResolvedValueOnce({
        exists: true,
        phoneNumber: "+254712345678",
      });
      mockRequestOtp.mockResolvedValueOnce({
        message: "OTP sent successfully",
      });
      render(<LoginPage />);
      const user = userEvent.setup();

      const phoneInput = screen.getByPlaceholderText("0712345678");
      await user.type(phoneInput, "+254712345678");

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCheckPhoneExists).toHaveBeenCalledWith("+254712345678");
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading spinner during phone check", async () => {
      mockCheckPhoneExists.mockImplementation(
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

    it("has link to sign up", () => {
      render(<LoginPage />);

      const signUpLinks = screen.getAllByText("Sign Up");
      expect(signUpLinks.length).toBeGreaterThan(0);
    });

    it("displays security message", () => {
      render(<LoginPage />);

      expect(
        screen.getByText(/secure\. transparent\. community owned\./i),
      ).toBeInTheDocument();
    });
  });
});
