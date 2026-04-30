// Feature: performance-and-i18n-improvements, Property 1: Locale detection is deterministic
import * as fc from "fast-check";
import { detectLocale } from "./i18n";

/**
 * Validates: Requirements 2.6, 4.2, 4.3
 *
 * Property 1: Locale detection is deterministic
 * - Output is always 'en' or 'sw'
 * - Priority: localStorage → backendLocale → navigatorLanguage → default 'en'
 */
describe("detectLocale (Property 1)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  it("Property 1: always returns en or sw", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.option(fc.string(), { nil: null }),
        fc.option(fc.string(), { nil: undefined }),
        (stored, backendLocale, navigatorLanguage) => {
          if (stored !== null) {
            (localStorage.getItem as jest.Mock).mockReturnValue(stored);
          } else {
            (localStorage.getItem as jest.Mock).mockReturnValue(null);
          }
          const result = detectLocale(
            backendLocale,
            navigatorLanguage ?? undefined,
          );
          return result === "en" || result === "sw";
        },
      ),
    );
  });

  it("Property 1: localStorage sw wins over everything", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.option(fc.string(), { nil: undefined }),
        (backendLocale, navigatorLanguage) => {
          (localStorage.getItem as jest.Mock).mockReturnValue("sw");
          const result = detectLocale(
            backendLocale,
            navigatorLanguage ?? undefined,
          );
          return result === "sw";
        },
      ),
    );
  });

  it("Property 1: localStorage en wins over everything", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.option(fc.string(), { nil: undefined }),
        (backendLocale, navigatorLanguage) => {
          (localStorage.getItem as jest.Mock).mockReturnValue("en");
          const result = detectLocale(
            backendLocale,
            navigatorLanguage ?? undefined,
          );
          return result === "en";
        },
      ),
    );
  });

  it("Property 1: backendLocale sw wins when localStorage is absent", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: undefined }),
        (navigatorLanguage) => {
          (localStorage.getItem as jest.Mock).mockReturnValue(null);
          const result = detectLocale("sw", navigatorLanguage ?? undefined);
          return result === "sw";
        },
      ),
    );
  });

  it("Property 1: navigator.language sw wins when localStorage and backend are absent", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.startsWith("sw")),
        (navLang) => {
          (localStorage.getItem as jest.Mock).mockReturnValue(null);
          const result = detectLocale(null, navLang);
          return result === "sw";
        },
      ),
    );
  });

  it("Property 1: defaults to en when all sources are absent or non-sw", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.startsWith("sw") && s !== "en"),
        (navLang) => {
          (localStorage.getItem as jest.Mock).mockReturnValue(null);
          const result = detectLocale(null, navLang);
          return result === "en";
        },
      ),
    );
  });
});
