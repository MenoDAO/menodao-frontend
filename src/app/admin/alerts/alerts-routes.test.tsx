import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AlertsPage from "./page";
import NotificationHistoryPage from "./history/page";
import SendNotificationPage from "./send/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock the components
jest.mock("../components/NotificationHistory", () => ({
  NotificationHistory: () => (
    <div data-testid="notification-history">Notification History Component</div>
  ),
}));

jest.mock("../components/SendNotification", () => ({
  SendNotification: () => (
    <div data-testid="send-notification">Send Notification Component</div>
  ),
}));

describe("Admin Alerts Routes", () => {
  describe("Main Alerts Page (/admin/alerts)", () => {
    it("should render the alerts overview page", () => {
      render(<AlertsPage />);

      expect(screen.getByText("Alerts & Notifications")).toBeInTheDocument();
      expect(
        screen.getByText("Manage SMS and push notifications for your members"),
      ).toBeInTheDocument();
    });

    it("should display navigation cards for send and history", () => {
      render(<AlertsPage />);

      expect(screen.getByText("Send Notification")).toBeInTheDocument();
      expect(screen.getByText("Notification History")).toBeInTheDocument();
    });

    it("should have links to send and history pages", () => {
      render(<AlertsPage />);

      const links = screen.getAllByRole("link");
      const sendLink = links.find(
        (link) => link.getAttribute("href") === "/admin/alerts/send",
      );
      const historyLink = links.find(
        (link) => link.getAttribute("href") === "/admin/alerts/history",
      );

      expect(sendLink).toBeInTheDocument();
      expect(historyLink).toBeInTheDocument();
    });

    it("should display quick overview section", () => {
      render(<AlertsPage />);

      expect(screen.getByText("Quick Overview")).toBeInTheDocument();
      expect(screen.getByText("Available Features")).toBeInTheDocument();
      expect(screen.getByText("Filter Options")).toBeInTheDocument();
      expect(screen.getByText("Delivery Tracking")).toBeInTheDocument();
    });

    it("should display notification system features", () => {
      render(<AlertsPage />);

      expect(
        screen.getByText("Notification System Features"),
      ).toBeInTheDocument();
      expect(screen.getByText("Advanced Filtering")).toBeInTheDocument();
      expect(screen.getByText("CSV Upload")).toBeInTheDocument();
      expect(screen.getByText("Recipient Preview")).toBeInTheDocument();
      expect(screen.getByText("Delivery Analytics")).toBeInTheDocument();
      expect(screen.getByText("Content Protection")).toBeInTheDocument();
      expect(screen.getByText("Audit Trail")).toBeInTheDocument();
    });
  });

  describe("Notification History Page (/admin/alerts/history)", () => {
    it("should render the notification history page", () => {
      render(<NotificationHistoryPage />);

      expect(screen.getByText("Notification History")).toBeInTheDocument();
      expect(
        screen.getByText(
          "View all sent notifications and their delivery status",
        ),
      ).toBeInTheDocument();
    });

    it("should render the NotificationHistory component", () => {
      render(<NotificationHistoryPage />);

      expect(screen.getByTestId("notification-history")).toBeInTheDocument();
    });
  });

  describe("Send Notification Page (/admin/alerts/send)", () => {
    it("should render the send notification page", () => {
      render(<SendNotificationPage />);

      expect(screen.getByText("Send Notification")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Compose and send SMS or push notifications to filtered member groups",
        ),
      ).toBeInTheDocument();
    });

    it("should render the SendNotification component", () => {
      render(<SendNotificationPage />);

      expect(screen.getByTestId("send-notification")).toBeInTheDocument();
    });
  });
});
