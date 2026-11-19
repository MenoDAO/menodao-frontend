import {
  currentAppPath,
  currentCallbackUrl,
  resolveCallbackUrl,
  sanitizeCallbackUrl,
  withCallbackUrl,
} from "../redirect";

describe("currentAppPath", () => {
  it("returns the current path with its query string", () => {
    window.history.pushState({}, "", "/dashboard/appointments?clinicId=abc");
    expect(currentAppPath()).toBe("/dashboard/appointments?clinicId=abc");
  });
});

describe("currentCallbackUrl", () => {
  it("reads callbackUrl from the address bar", () => {
    window.history.pushState({}, "", "/admin/login?callbackUrl=%2Fadmin%2Fusers");
    expect(currentCallbackUrl()).toBe("/admin/users");
  });

  it("returns null when the parameter is absent", () => {
    window.history.pushState({}, "", "/admin/login");
    expect(currentCallbackUrl()).toBeNull();
  });
});

describe("withCallbackUrl", () => {
  it("appends the current path as an encoded callbackUrl", () => {
    expect(withCallbackUrl("/login", "/dashboard/appointments?clinicId=abc")).toBe(
      "/login?callbackUrl=%2Fdashboard%2Fappointments%3FclinicId%3Dabc",
    );
  });

  it("drops the parameter when there is nothing to return to", () => {
    expect(withCallbackUrl("/login", "")).toBe("/login");
  });

  it("does not point the login page back at itself", () => {
    expect(withCallbackUrl("/login", "/login")).toBe("/login");
    expect(withCallbackUrl("/login", "/login?foo=1")).toBe("/login");
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example/phish",
    "/\\evil.example/phish",
    "javascript:alert(1)",
  ])("refuses to carry an off-site destination %s", (currentPath) => {
    expect(withCallbackUrl("/login", currentPath)).toBe("/login");
  });
});

describe("sanitizeCallbackUrl", () => {
  it("keeps same-site paths including their query string", () => {
    expect(sanitizeCallbackUrl("/dashboard/transactions?page=2")).toBe(
      "/dashboard/transactions?page=2",
    );
  });

  it("returns null for missing values", () => {
    expect(sanitizeCallbackUrl(null)).toBeNull();
    expect(sanitizeCallbackUrl(undefined)).toBeNull();
    expect(sanitizeCallbackUrl("")).toBeNull();
    expect(sanitizeCallbackUrl("   ")).toBeNull();
  });

  it.each([
    "https://evil.example",
    "http://evil.example",
    "//evil.example",
    "/\\evil.example",
    "evil.example",
    "/dashboard\u0000",
  ])("rejects %s", (value) => {
    expect(sanitizeCallbackUrl(value)).toBeNull();
  });

  it("rejects percent-encoded off-site destinations", () => {
    // `%2F%2Fevil.example` decodes to `//evil.example`.
    expect(sanitizeCallbackUrl("%2F%2Fevil.example")).toBeNull();
    // `/%2Fevil.example` decodes to `//evil.example`.
    expect(sanitizeCallbackUrl("/%2Fevil.example")).toBeNull();
  });

  it("rejects malformed percent-encoding rather than throwing", () => {
    expect(sanitizeCallbackUrl("/dashboard%")).toBe("/dashboard%");
  });
});

describe("resolveCallbackUrl", () => {
  it("returns the sanitised value when it is safe", () => {
    expect(resolveCallbackUrl("/admin/users", "/admin")).toBe("/admin/users");
  });

  it("falls back when the value is missing", () => {
    expect(resolveCallbackUrl(null, "/admin")).toBe("/admin");
  });

  it("falls back when the value is unsafe", () => {
    expect(resolveCallbackUrl("https://evil.example", "/admin")).toBe("/admin");
    expect(resolveCallbackUrl("//evil.example", "/admin")).toBe("/admin");
  });
});
