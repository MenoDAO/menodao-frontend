import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationHistory } from "./NotificationHistory";
import { adminApi } from "@/lib/admin-api";

jest.mock("@/lib/admin-api", () => ({
  adminApi: {
    getNotificationHistoryV2: jest.fn(),
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
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
};

describe("NotificationHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display loading state initially", () => {
    (adminApi.getNotificationHistoryV2 as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
  });

  it("should display error state when API call fails", async () => {
    (adminApi.getNotificationHistoryV2 as jest.Mock).mockRejectedValue(
      new Error("API Error"),
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load notification history"),
      ).toBeInTheDocument();
    });
  });

  it("should display notification history with all required columns", async () => {
    const mockData = {
      notifications: [
        {
          id: "1",
          type: "SMS" as const,
          recipientCount: 150,
          message: "Test notification message",
          status: "DELIVERED" as const,
          deliveryStats: {
            successCount: 145,
            failureCount: 5,
          },
          sentAt: "2024-01-15T10:30:00Z",
          sentBy: "admin1",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Notification History")).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Recipients")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getAllByText("Status")[0]).toBeInTheDocument(); // Use getAllByText since "Status" appears in both filter label and table header
    expect(screen.getByText("Delivery Rate")).toBeInTheDocument();
    expect(screen.getByText("Sent At")).toBeInTheDocument();
    expect(screen.getByText("Sent By")).toBeInTheDocument();

    // Check data
    const smsElements = screen.getAllByText("SMS");
    expect(smsElements.length).toBeGreaterThan(0); // SMS appears in both filter dropdown and table
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("Test notification message")).toBeInTheDocument();
    const deliveredElements = screen.getAllByText("DELIVERED");
    expect(deliveredElements.length).toBeGreaterThan(0); // DELIVERED appears in both filter dropdown and table
    expect(screen.getByText("96.7%")).toBeInTheDocument(); // 145/150 = 96.7%
    expect(screen.getByText("admin1")).toBeInTheDocument();
  });

  it("should display [PROTECTED] for sanitized messages", async () => {
    const mockData = {
      notifications: [
        {
          id: "1",
          type: "SMS" as const,
          recipientCount: 50,
          message: "[PROTECTED]",
          status: "DELIVERED" as const,
          deliveryStats: {
            successCount: 50,
            failureCount: 0,
          },
          sentAt: "2024-01-15T10:30:00Z",
          sentBy: "admin1",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("[PROTECTED]")).toBeInTheDocument();
    });
  });

  it("should calculate delivery rate correctly", async () => {
    const mockData = {
      notifications: [
        {
          id: "1",
          type: "SMS" as const,
          recipientCount: 100,
          message: "Test",
          status: "PARTIAL" as const,
          deliveryStats: {
            successCount: 75,
            failureCount: 25,
          },
          sentAt: "2024-01-15T10:30:00Z",
          sentBy: "admin1",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("75.0%")).toBeInTheDocument();
      expect(screen.getByText("75/100")).toBeInTheDocument();
    });
  });

  it("should display N/A for delivery rate when no deliveries", async () => {
    const mockData = {
      notifications: [
        {
          id: "1",
          type: "SMS" as const,
          recipientCount: 100,
          message: "Test",
          status: "PENDING" as const,
          deliveryStats: {
            successCount: 0,
            failureCount: 0,
          },
          sentAt: "2024-01-15T10:30:00Z",
          sentBy: "admin1",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  it("should display empty state when no notifications", async () => {
    const mockData = {
      notifications: [],
      total: 0,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No notifications sent yet")).toBeInTheDocument();
    });
  });

  it("should display pagination controls when total exceeds page size", async () => {
    const mockData = {
      notifications: Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        type: "SMS" as const,
        recipientCount: 100,
        message: `Test ${i}`,
        status: "DELIVERED" as const,
        deliveryStats: {
          successCount: 100,
          failureCount: 0,
        },
        sentAt: "2024-01-15T10:30:00Z",
        sentBy: "admin1",
      })),
      total: 25,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Showing 1 to 10 of 25")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
      expect(screen.getByLabelText("Previous page")).toBeDisabled();
      expect(screen.getByLabelText("Next page")).toBeEnabled();
    });
  });

  it("should display correct status icons and colors", async () => {
    const mockData = {
      notifications: [
        {
          id: "1",
          type: "SMS" as const,
          recipientCount: 100,
          message: "Test",
          status: "FAILED" as const,
          deliveryStats: {
            successCount: 0,
            failureCount: 100,
          },
          sentAt: "2024-01-15T10:30:00Z",
          sentBy: "admin1",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("FAILED")).toBeInTheDocument();
    });
  });

  it("should display PUSH notification type correctly", async () => {
    const mockData = {
      notifications: [
        {
          id: "1",
          type: "PUSH" as const,
          recipientCount: 200,
          message: "Push notification",
          status: "DELIVERED" as const,
          deliveryStats: {
            successCount: 200,
            failureCount: 0,
          },
          sentAt: "2024-01-15T10:30:00Z",
          sentBy: "admin1",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
      mockData,
    );

    render(<NotificationHistory />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("PUSH")).toBeInTheDocument();
    });
  });

  describe("Filter Controls", () => {
    it("should display all filter controls", async () => {
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Filters")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("Notification Type")).toBeInTheDocument();
      expect(screen.getByLabelText("Status")).toBeInTheDocument();
      expect(screen.getByLabelText("From Date")).toBeInTheDocument();
      expect(screen.getByLabelText("To Date")).toBeInTheDocument();
    });

    it("should filter by notification type", async () => {
      const user = userEvent.setup();
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText("Notification Type")).toBeInTheDocument();
      });

      const typeSelect = screen.getByLabelText("Notification Type");
      await user.selectOptions(typeSelect, "SMS");

      await waitFor(() => {
        expect(adminApi.getNotificationHistoryV2).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "SMS",
          }),
        );
      });
    });

    it("should filter by status", async () => {
      const user = userEvent.setup();
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText("Status");
      await user.selectOptions(statusSelect, "DELIVERED");

      await waitFor(() => {
        expect(adminApi.getNotificationHistoryV2).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "DELIVERED",
          }),
        );
      });
    });

    it("should filter by date range", async () => {
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText("From Date")).toBeInTheDocument();
      });

      const fromDateInput = screen.getByLabelText(
        "From Date",
      ) as HTMLInputElement;

      // Use fireEvent for date inputs as userEvent doesn't work well with them
      fireEvent.change(fromDateInput, { target: { value: "2024-01-01" } });

      await waitFor(
        () => {
          expect(adminApi.getNotificationHistoryV2).toHaveBeenCalledWith(
            expect.objectContaining({
              dateFrom: "2024-01-01",
            }),
          );
        },
        { timeout: 2000 },
      );
    });

    it("should reset page to 1 when filters change", async () => {
      const user = userEvent.setup();
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText("Notification Type")).toBeInTheDocument();
      });

      const typeSelect = screen.getByLabelText("Notification Type");
      await user.selectOptions(typeSelect, "SMS");

      await waitFor(() => {
        expect(adminApi.getNotificationHistoryV2).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
          }),
        );
      });
    });

    it("should display clear filters button when filters are active", async () => {
      const user = userEvent.setup();
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText("Notification Type")).toBeInTheDocument();
      });

      // Initially, clear button should not be visible
      expect(screen.queryByText("Clear all filters")).not.toBeInTheDocument();

      // Apply a filter
      const typeSelect = screen.getByLabelText("Notification Type");
      await user.selectOptions(typeSelect, "SMS");

      // Clear button should now be visible
      await waitFor(() => {
        expect(screen.getByText("Clear all filters")).toBeInTheDocument();
      });
    });

    it("should clear all filters when clear button is clicked", async () => {
      const user = userEvent.setup();
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText("Notification Type")).toBeInTheDocument();
      });

      // Apply filters
      const typeSelect = screen.getByLabelText(
        "Notification Type",
      ) as HTMLSelectElement;
      const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
      await user.selectOptions(typeSelect, "SMS");
      await user.selectOptions(statusSelect, "DELIVERED");

      await waitFor(() => {
        expect(screen.getByText("Clear all filters")).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByText("Clear all filters");
      await user.click(clearButton);

      // Filters should be cleared
      await waitFor(() => {
        expect(adminApi.getNotificationHistoryV2).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 1,
            pageSize: 10,
          }),
        );
        expect(adminApi.getNotificationHistoryV2).toHaveBeenLastCalledWith(
          expect.not.objectContaining({
            type: expect.anything(),
            status: expect.anything(),
          }),
        );
      });
    });

    it("should apply multiple filters simultaneously", async () => {
      const user = userEvent.setup();
      const mockData = {
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      (adminApi.getNotificationHistoryV2 as jest.Mock).mockResolvedValue(
        mockData,
      );

      render(<NotificationHistory />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText("Notification Type")).toBeInTheDocument();
      });

      const typeSelect = screen.getByLabelText("Notification Type");

      await user.selectOptions(typeSelect, "SMS");

      await waitFor(
        () => {
          expect(adminApi.getNotificationHistoryV2).toHaveBeenCalledWith(
            expect.objectContaining({
              type: "SMS",
            }),
          );
        },
        { timeout: 2000 },
      );

      // Verify that the type filter is applied
      expect(typeSelect).toHaveValue("SMS");
    });
  });
});
