import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminConversationsPage from "./page";
import { adminApi } from "@/lib/admin-api";

jest.mock("@/lib/admin-store", () => ({
  useAdminStore: () => ({
    admin: { id: "admin-1", username: "ops", role: "SUPER_ADMIN" },
  }),
}));

jest.mock("@/lib/admin-api", () => ({
  adminApi: {
    listWhatsappInstances: jest.fn(),
    listBotThreads: jest.fn(),
    listBotThreadMessages: jest.fn(),
    botChatRetention: jest.fn(),
    purgeBotChat: jest.fn(),
    eraseBotChatMember: jest.fn(),
    exportBotChatMember: jest.fn(),
  },
}));

const mockedApi = adminApi as jest.Mocked<typeof adminApi>;

const thread = {
  id: "thread-1",
  instanceId: "row-1",
  memberId: "member-1",
  contactId: "254713278107",
  contactName: "Amina",
  status: "OPEN",
  consentBasis: "SERVICE_DELIVERY",
  startedAt: "2026-11-16T07:00:00.000Z",
  lastMessageAt: "2026-11-16T07:05:00.000Z",
  messageCount: 2,
  retentionUntil: "2028-11-15T07:05:00.000Z",
  erasedAt: null,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AdminConversationsPage />
    </QueryClientProvider>,
  );
}

describe("admin conversations page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.listWhatsappInstances.mockResolvedValue({
      instances: [],
      activeInstanceId: null,
      plan: {
        name: "Basic",
        maxInstances: 1,
        maxApiCalls: 5000,
        status: "active",
        endsAt: null,
      },
      slotsUsed: 0,
      slotsRemaining: 1,
      webhookUrl: null,
      webhookNote: "",
    });
    mockedApi.botChatRetention.mockResolvedValue({
      retentionDays: 730,
      description: "kept",
    });
    mockedApi.listBotThreads.mockResolvedValue([thread]);
    mockedApi.listBotThreadMessages.mockResolvedValue([
      {
        id: "m1",
        threadId: "thread-1",
        direction: "INBOUND",
        content: "hello, I need help",
        contentType: "TEXT",
        deliveryStatus: "RECEIVED",
        providerMessageId: "p1",
        sentAt: "2026-11-16T07:00:00.000Z",
      },
      {
        id: "m2",
        threadId: "thread-1",
        direction: "OUTBOUND",
        content: "Kariba! Welcome to MenoDAO.",
        contentType: "TEXT",
        deliveryStatus: "FAILED",
        providerMessageId: null,
        sentAt: "2026-11-16T07:05:00.000Z",
      },
    ]);
  });

  it("lists conversations with the retention policy in force", async () => {
    renderPage();

    expect(await screen.findByText("Amina")).toBeInTheDocument();
    expect(screen.getByText(/2 messages/)).toBeInTheDocument();
    expect(
      screen.getByText(/730 days after the last message/),
    ).toBeInTheDocument();
  });

  it("opens a conversation and marks a failed outbound as not delivered", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Amina"));

    expect(await screen.findByText("hello, I need help")).toBeInTheDocument();
    expect(
      screen.getByText("Kariba! Welcome to MenoDAO."),
    ).toBeInTheDocument();
    expect(screen.getByText(/not delivered/)).toBeInTheDocument();
    expect(screen.getAllByText(/member member-1/).length).toBeGreaterThan(0);
  });

  it("only links erasure to a member-backed thread", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Amina"));

    const erase = screen.getByRole("button", { name: /erase/i });
    expect(erase).toBeEnabled();

    await user.click(erase);
    expect(
      screen.getByText(/Permanently deletes every bot conversation/i),
    ).toBeInTheDocument();
  });
});
