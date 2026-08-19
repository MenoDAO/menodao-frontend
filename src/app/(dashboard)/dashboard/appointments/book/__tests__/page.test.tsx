import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BookAppointmentPage from "../page";

const mockPush = jest.fn();
let search = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => search,
}));

jest.mock("@/lib/api", () => ({
  api: {
    getPublicClinic: jest.fn(),
    getAppointmentSlots: jest.fn(),
    bookAppointment: jest.fn(),
    rescheduleAppointment: jest.fn(),
  },
}));

import { api } from "@/lib/api";

const wrap = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
};

describe("BookAppointmentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search = new URLSearchParams();
  });

  it("links back to Find a Clinic when clinicId is missing", () => {
    render(<BookAppointmentPage />, { wrapper: wrap() });
    expect(screen.getByRole("link", { name: /find a clinic/i })).toHaveAttribute(
      "href",
      "/dashboard/camps",
    );
  });

  it("loads clinic details and listed slots for the selected clinic", async () => {
    search = new URLSearchParams("clinicId=clinic-1");
    (api.getPublicClinic as jest.Mock).mockResolvedValue({
      id: "clinic-1",
      name: "Westlands Dental",
      leadDentistName: "Dr A",
      physicalLocation: "Waiyaki Way",
    });
    (api.getAppointmentSlots as jest.Mock).mockResolvedValue({
      clinicId: "clinic-1",
      date: "2026-08-20",
      durationMinutes: 30,
      chairs: 1,
      slots: [
        {
          scheduledAt: "2026-08-20T07:00:00.000Z",
          label: "10:00",
          available: true,
        },
      ],
    });

    render(<BookAppointmentPage />, { wrapper: wrap() });

    expect(await screen.findByText(/Westlands Dental/)).toBeInTheDocument();
    expect(api.getAppointmentSlots).toHaveBeenCalledWith(
      "clinic-1",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
    expect(screen.getByRole("button", { name: /confirm appointment/i })).toBeDisabled();
  });
});
