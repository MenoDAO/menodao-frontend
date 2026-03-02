import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SendNotification } from "./SendNotification";

describe("SendNotification - Filter Controls", () => {
  it("should render all recipient filter controls", () => {
    render(<SendNotification />);

    // Check for filter section
    expect(screen.getByText("Recipient Filters")).toBeInTheDocument();

    // Check for package type checkboxes
    expect(screen.getByText("Package Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Bronze")).toBeInTheDocument();
    expect(screen.getByLabelText("Silver")).toBeInTheDocument();
    expect(screen.getByLabelText("Gold")).toBeInTheDocument();

    // Check for date range inputs
    expect(screen.getByLabelText("Date Joined From")).toBeInTheDocument();
    expect(screen.getByLabelText("Date Joined To")).toBeInTheDocument();

    // Check for balance range inputs
    expect(screen.getByLabelText("Balance Min")).toBeInTheDocument();
    expect(screen.getByLabelText("Balance Max")).toBeInTheDocument();

    // Check for subscription status radio buttons
    expect(screen.getByText("Subscription Status")).toBeInTheDocument();
    expect(screen.getByLabelText("All")).toBeInTheDocument();
    expect(screen.getByLabelText("Active")).toBeInTheDocument();
    expect(screen.getByLabelText("Inactive")).toBeInTheDocument();

    // Check for single phone number input
    expect(screen.getByLabelText("Single Phone Number")).toBeInTheDocument();

    // Check for CSV upload
    expect(screen.getByText("Upload CSV File")).toBeInTheDocument();
    expect(screen.getByText("Choose CSV file")).toBeInTheDocument();
  });

  it("should allow selecting multiple package types", async () => {
    const user = userEvent.setup();
    render(<SendNotification />);

    const bronzeCheckbox = screen.getByLabelText("Bronze") as HTMLInputElement;
    const silverCheckbox = screen.getByLabelText("Silver") as HTMLInputElement;

    expect(bronzeCheckbox.checked).toBe(false);
    expect(silverCheckbox.checked).toBe(false);

    await user.click(bronzeCheckbox);
    expect(bronzeCheckbox.checked).toBe(true);

    await user.click(silverCheckbox);
    expect(silverCheckbox.checked).toBe(true);

    // Uncheck bronze
    await user.click(bronzeCheckbox);
    expect(bronzeCheckbox.checked).toBe(false);
    expect(silverCheckbox.checked).toBe(true);
  });

  it("should allow entering date range", async () => {
    render(<SendNotification />);

    const fromDateInput = screen.getByLabelText(
      "Date Joined From",
    ) as HTMLInputElement;
    const toDateInput = screen.getByLabelText(
      "Date Joined To",
    ) as HTMLInputElement;

    fireEvent.change(fromDateInput, { target: { value: "2024-01-01" } });
    fireEvent.change(toDateInput, { target: { value: "2024-12-31" } });

    expect(fromDateInput.value).toBe("2024-01-01");
    expect(toDateInput.value).toBe("2024-12-31");
  });

  it("should allow entering balance range", async () => {
    const user = userEvent.setup();
    render(<SendNotification />);

    const minInput = screen.getByLabelText("Balance Min") as HTMLInputElement;
    const maxInput = screen.getByLabelText("Balance Max") as HTMLInputElement;

    await user.type(minInput, "100");
    await user.type(maxInput, "500");

    expect(minInput.value).toBe("100");
    expect(maxInput.value).toBe("500");
  });

  it("should allow selecting subscription status", async () => {
    const user = userEvent.setup();
    render(<SendNotification />);

    const allRadio = screen.getByLabelText("All") as HTMLInputElement;
    const activeRadio = screen.getByLabelText("Active") as HTMLInputElement;
    const inactiveRadio = screen.getByLabelText("Inactive") as HTMLInputElement;

    // Default should be "All"
    expect(allRadio.checked).toBe(true);
    expect(activeRadio.checked).toBe(false);
    expect(inactiveRadio.checked).toBe(false);

    await user.click(activeRadio);
    expect(activeRadio.checked).toBe(true);
    expect(allRadio.checked).toBe(false);

    await user.click(inactiveRadio);
    expect(inactiveRadio.checked).toBe(true);
    expect(activeRadio.checked).toBe(false);
  });

  it("should allow entering single phone number", async () => {
    const user = userEvent.setup();
    render(<SendNotification />);

    const phoneInput = screen.getByLabelText(
      "Single Phone Number",
    ) as HTMLInputElement;

    await user.type(phoneInput, "+1234567890");
    expect(phoneInput.value).toBe("+1234567890");
  });

  it("should validate CSV file format", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a non-CSV file
    const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(
      await screen.findByText("File must be in CSV format"),
    ).toBeInTheDocument();
  });

  it("should validate CSV file size", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a file larger than 5MB
    const largeContent = "a".repeat(6 * 1024 * 1024); // 6MB
    const largeFile = new File([largeContent], "large.csv", {
      type: "text/csv",
    });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(
      await screen.findByText("CSV file exceeds maximum size of 5MB"),
    ).toBeInTheDocument();
  });

  it("should accept valid CSV file", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const validFile = new File(
      ["Phone Number\n+254712345678\n+254787654321"],
      "phones.csv",
      { type: "text/csv" },
    );
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(
      await screen.findByText("File selected: phones.csv"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("2 valid phone numbers extracted"),
    ).toBeInTheDocument();
  });

  it("should parse CSV and extract valid phone numbers", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const csvContent = `Phone Number
+254712345678
0787654321
254723456789`;

    const validFile = new File([csvContent], "phones.csv", {
      type: "text/csv",
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(
      await screen.findByText("3 valid phone numbers extracted"),
    ).toBeInTheDocument();
  });

  it("should skip header row when parsing CSV", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const csvContent = `Phone Number
+254712345678
+254787654321`;

    const validFile = new File([csvContent], "phones.csv", {
      type: "text/csv",
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Should extract 2 valid numbers, not 3 (header should be skipped)
    expect(
      await screen.findByText("2 valid phone numbers extracted"),
    ).toBeInTheDocument();
  });

  it("should deduplicate phone numbers from CSV", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const csvContent = `Phone Number
+254712345678
+254712345678
0712345678`;

    const validFile = new File([csvContent], "phones.csv", {
      type: "text/csv",
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Should extract only 1 unique number (all three are the same)
    expect(
      await screen.findByText("1 valid phone number extracted"),
    ).toBeInTheDocument();
  });

  it("should show validation errors for invalid phone numbers", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const csvContent = `Phone Number
+254712345678
invalid-phone
12345`;

    const validFile = new File([csvContent], "phones.csv", {
      type: "text/csv",
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(
      await screen.findByText("1 valid phone number extracted"),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Validation warnings/)).toBeInTheDocument();
  });

  it("should handle empty CSV file", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const emptyFile = new File([""], "empty.csv", { type: "text/csv" });
    fireEvent.change(fileInput, { target: { files: [emptyFile] } });

    expect(await screen.findByText("CSV file is empty")).toBeInTheDocument();
  });

  it("should handle CSV with all invalid phone numbers", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const csvContent = `Phone Number
invalid1
invalid2
12345`;

    const invalidFile = new File([csvContent], "invalid.csv", {
      type: "text/csv",
    });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(
      await screen.findByText("No valid phone numbers found in CSV"),
    ).toBeInTheDocument();
  });

  it("should normalize phone numbers to consistent format", async () => {
    const { container } = render(<SendNotification />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Different formats of the same number
    const csvContent = `Phone Number
0712345678
254712345678
+254712345678`;

    const validFile = new File([csvContent], "phones.csv", {
      type: "text/csv",
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Should deduplicate to 1 number after normalization
    expect(
      await screen.findByText("1 valid phone number extracted"),
    ).toBeInTheDocument();
  });

  it("should display notification type selector", () => {
    render(<SendNotification />);

    expect(screen.getByText("Notification Type")).toBeInTheDocument();
    expect(screen.getByLabelText("SMS")).toBeInTheDocument();
    expect(screen.getByLabelText("Push Notification")).toBeInTheDocument();
  });

  it("should display message textarea with character counter", () => {
    render(<SendNotification />);

    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(screen.getByText("0 characters")).toBeInTheDocument();
  });

  it("should display recipient preview section", () => {
    render(<SendNotification />);

    expect(screen.getByText("Recipients")).toBeInTheDocument();
    expect(
      screen.getByText("Select filters to preview recipient count"),
    ).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("members")).toBeInTheDocument();
  });
});

describe("SendNotification - Recipient Preview", () => {
  it("should display recipient preview section with initial count of 0", () => {
    render(<SendNotification />);

    expect(screen.getByText("Recipients")).toBeInTheDocument();
    expect(
      screen.getByText("Select filters to preview recipient count"),
    ).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("members")).toBeInTheDocument();
  });

  it("should disable send button when recipient count is 0", () => {
    render(<SendNotification />);

    const sendButton = screen.getByRole("button", {
      name: /send notification/i,
    });

    expect(sendButton).toBeDisabled();
  });

  it("should disable send button when message is empty even with filters", async () => {
    const user = userEvent.setup();
    render(<SendNotification />);

    // Select a filter
    const bronzeCheckbox = screen.getByLabelText("Bronze");
    await user.click(bronzeCheckbox);

    const sendButton = screen.getByRole("button", {
      name: /send notification/i,
    });

    // Empty message should keep button disabled
    expect(sendButton).toBeDisabled();
  });
});

describe("SendNotification - Send Workflow", () => {
  it("should display character counter that updates with message", async () => {
    const user = userEvent.setup();
    render(<SendNotification />);

    const messageInput = screen.getByLabelText("Message");

    expect(screen.getByText("0 characters")).toBeInTheDocument();

    await user.type(messageInput, "Hello");

    expect(screen.getByText("5 characters")).toBeInTheDocument();
  });

  it("should enforce SMS character limit", async () => {
    render(<SendNotification />);

    const messageInput = screen.getByLabelText(
      "Message",
    ) as HTMLTextAreaElement;

    // SMS should have maxLength of 1600
    expect(messageInput.maxLength).toBe(1600);
  });
});
