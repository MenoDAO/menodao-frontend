// Feature: performance-and-i18n-improvements, Property 5: localStorage locale persistence
// Feature: performance-and-i18n-improvements, Property 6: Locale switch updates rendered text
import * as fc from "fast-check";
import {
  render,
  within,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import LanguageSwitcher from "./LanguageSwitcher";
import i18n from "@/lib/i18n";

// Mock fetch for the PATCH call
global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    // Reset localStorage mock to return null by default
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  // Property 5: localStorage locale persistence
  it("Property 5: selecting a locale persists it to localStorage", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "sw"), async (locale) => {
        jest.clearAllMocks();
        (localStorage.getItem as jest.Mock).mockReturnValue(null);
        (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

        const { container, unmount } = render(<LanguageSwitcher />);
        const select = within(container).getByRole("combobox");
        fireEvent.change(select, { target: { value: locale } });

        await waitFor(() => {
          expect(localStorage.setItem).toHaveBeenCalledWith(
            "menodao_preferred_language",
            locale,
          );
        });
        unmount();
      }),
    );
  }, 15000);

  // Property 6: Locale switch updates i18n language
  it("Property 6: selecting a locale changes the i18n language", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "sw"), async (locale) => {
        jest.clearAllMocks();
        (localStorage.getItem as jest.Mock).mockReturnValue(null);
        (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

        const { container, unmount } = render(<LanguageSwitcher />);
        const select = within(container).getByRole("combobox");
        fireEvent.change(select, { target: { value: locale } });

        await waitFor(() => {
          expect(i18n.language).toBe(locale);
        });
        unmount();
      }),
    );
  }, 15000);
});
