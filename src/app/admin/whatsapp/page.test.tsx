import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminWhatsappPage from "./page";
import { adminApi } from "@/lib/admin-api";

jest.mock("qrcode.react", () => ({
  QRCodeSVG: () => <svg data-testid="qr" />,
}));

jest.mock("@/lib/admin-store", () => ({
  useAdminStore: () => ({
    admin: { id: "admin-1", username: "ops", role: "SUPER_ADMIN" },
  }),
}));

jest.mock("@/lib/admin-api", () => ({
  adminApi: {
    listWhatsappInstances: jest.fn(),
    syncWhatsappInstances: jest.fn(),
    createWhatsappInstance: jest.fn(),
    reconnectWhatsappInstance: jest.fn(),
    whatsappPairingCode: jest.fn(),
    whatsappQr: jest.fn(),
    relinkWhatsappInstance: jest.fn(),
    activateWhatsappInstance: jest.fn(),
    storeWhatsappInstanceKey: jest.fn(),
    deleteWhatsappInstance: jest.fn(),
  },
}));

const mockedApi = adminApi as jest.Mocked<typeof adminApi>;

const instance = {
  id: "row-1",
  provider: "flaresend",
  providerId: "c24c074b-bb05-4a55-8e6f-e894ecf73352",
  label: "Clinic main line",
  phoneNumber: "254713278107",
  status: "DISCONNECTED",
  isActive: true,
  webhookUrl: null,
  hasStoredKey: false,
  keyFingerprint: null,
  lastCheckedAt: null,
  lastConnectedAt: null,
  createdAt: "2026-11-16T07:00:00.000Z",
  updatedAt: "2026-11-16T07:00:00.000Z",
};

const overview = {
  instances: [instance],
  activeInstanceId: "row-1",
  plan: {
    name: "Basic",
    maxInstances: 1,
    maxApiCalls: 5000,
    status: "active",
    endsAt: "2026-12-14T15:06:25.000Z",
  },
  slotsUsed: 1,
  slotsRemaining: 0,
  webhookUrl: "https://dev-api.menodao.org/bot/webhook/flaresend/token",
  webhookNote: "Paste this into the FlareSend dashboard.",
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AdminWhatsappPage />
    </QueryClientProvider>,
  );
}

describe("admin WhatsApp page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.listWhatsappInstances.mockResolvedValue(overview);
  });

  it("shows the plan, the webhook URL and the instance status", async () => {
    renderPage();

    expect(
      (await screen.findAllByText("Clinic main line")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText(/1\/1 instances/)).toBeInTheDocument();
    expect(
      screen.getByText("https://dev-api.menodao.org/bot/webhook/flaresend/token"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Disconnected").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+254713278107").length).toBeGreaterThan(0);
  });

  it("requests a pairing code and shows it", async () => {
    const user = userEvent.setup();
    mockedApi.reconnectWhatsappInstance.mockResolvedValue(instance);
    mockedApi.whatsappPairingCode.mockResolvedValue({
      pairingCode: "ABCD1234",
      status: "AWAITING_SCAN",
    });

    renderPage();
    await screen.findAllByText("Clinic main line");

    await user.click(screen.getByRole("button", { name: /get code/i }));

    expect(await screen.findByText("ABCD1234")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedApi.whatsappPairingCode).toHaveBeenCalledWith(
        "row-1",
        "254713278107",
      ),
    );
  });

  it("disables adding an instance when the plan has no free slot", async () => {
    renderPage();
    await screen.findAllByText("Clinic main line");

    expect(screen.getByRole("button", { name: /add instance/i })).toBeDisabled();
  });

  it("surfaces the plan guard when creating is refused", async () => {
    const user = userEvent.setup();
    mockedApi.listWhatsappInstances.mockResolvedValue({
      ...overview,
      slotsRemaining: 1,
    });
    mockedApi.createWhatsappInstance.mockRejectedValue(
      new Error("The Basic plan allows 1 WhatsApp instance(s)"),
    );

    renderPage();
    await screen.findAllByText("Clinic main line");

    await user.click(screen.getByRole("button", { name: /add instance/i }));
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(
      await screen.findByText(/allows 1 WhatsApp instance\(s\)/),
    ).toBeInTheDocument();
  });
});
