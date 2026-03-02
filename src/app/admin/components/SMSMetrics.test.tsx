import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SMSMetrics } from "./SMSMetrics";
import { adminApi } from "@/lib/admin-api";

// Mock the admin API
jest.mock("@/lib/admin-api", () => ({
  adminApi: {
    getSMSStats: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("SMSMetrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display loading state initially", () => {
    (adminApi.getSMSStats as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<SMSMetrics />, { wrapper: createWrapper() });

    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
  });

  it("should display SMS metrics when data is loaded", async () => {
    const mockData = {
      todayCount: 42,
      allTimeCount: 1337,
    };

    (adminApi.getSMSStats as jest.Mock).mockResolvedValue(mockData);

    render(<SMSMetrics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("SMS sent today")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("Total SMS sent")).toBeInTheDocument();
      expect(screen.getByText("1,337")).toBeInTheDocument();
    });
  });

  it("should display error state when API call fails", async () => {
    (adminApi.getSMSStats as jest.Mock).mockRejectedValue(
      new Error("API Error"),
    );

    render(<SMSMetrics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load SMS metrics"),
      ).toBeInTheDocument();
    });
  });

  it("should format large numbers with commas", async () => {
    const mockData = {
      todayCount: 1234,
      allTimeCount: 9876543,
    };

    (adminApi.getSMSStats as jest.Mock).mockResolvedValue(mockData);

    render(<SMSMetrics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("1,234")).toBeInTheDocument();
      expect(screen.getByText("9,876,543")).toBeInTheDocument();
    });
  });

  it("should display zero when counts are zero", async () => {
    const mockData = {
      todayCount: 0,
      allTimeCount: 0,
    };

    (adminApi.getSMSStats as jest.Mock).mockResolvedValue(mockData);

    render(<SMSMetrics />, { wrapper: createWrapper() });

    await waitFor(() => {
      const zeros = screen.getAllByText("0");
      expect(zeros).toHaveLength(2);
    });
  });
});
