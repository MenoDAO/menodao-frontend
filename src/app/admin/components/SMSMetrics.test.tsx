import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SMSMetrics } from "./SMSMetrics";
import { adminApi } from "@/lib/admin-api";

// Mock the admin API
jest.mock("@/lib/admin-api", () => ({
  adminApi: {
    getSmsMetrics: jest.fn(),
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

const makeMockData = (todayCount: number, allTimeTotal: number) => ({
  todayCount,
  allTimeTotal,
  byStatus: [],
  dailyBreakdown: [],
});

describe("SMSMetrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display loading state initially", () => {
    (adminApi.getSmsMetrics as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<SMSMetrics />, { wrapper: createWrapper() });

    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
  });

  it("should display SMS metrics when data is loaded", async () => {
    (adminApi.getSmsMetrics as jest.Mock).mockResolvedValue(
      makeMockData(42, 1337),
    );

    render(<SMSMetrics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("All Time")).toBeInTheDocument();
      expect(screen.getByText("1,337")).toBeInTheDocument();
    });
  });

  it("should display error state when API call fails", async () => {
    (adminApi.getSmsMetrics as jest.Mock).mockRejectedValue(
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
    (adminApi.getSmsMetrics as jest.Mock).mockResolvedValue(
      makeMockData(1234, 9876543),
    );

    render(<SMSMetrics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("1,234")).toBeInTheDocument();
      expect(screen.getByText("9,876,543")).toBeInTheDocument();
    });
  });

  it("should display zero when counts are zero", async () => {
    (adminApi.getSmsMetrics as jest.Mock).mockResolvedValue(makeMockData(0, 0));

    render(<SMSMetrics />, { wrapper: createWrapper() });

    await waitFor(() => {
      const zeros = screen.getAllByText("0");
      expect(zeros).toHaveLength(2);
    });
  });
});
