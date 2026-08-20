import {
  clearPasskeyOnThisDevice,
  isAlreadyRegisteredError,
  isThisDeviceRegistered,
  markPasskeyOnThisDevice,
  type PasskeyDevice,
} from "../passkeys";

const device = (id: string): PasskeyDevice => ({
  id,
  label: "Linux x86_64",
  deviceType: "singleDevice",
  createdAt: "2026-08-19T00:00:00.000Z",
  lastUsedAt: null,
});

describe("isThisDeviceRegistered", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is false when no devices are registered", () => {
    markPasskeyOnThisDevice("staff", "abc");
    expect(isThisDeviceRegistered("staff", [])).toBe(false);
  });

  it("is true when this browser saved the listed credential id", () => {
    markPasskeyOnThisDevice("staff", "abc");
    expect(isThisDeviceRegistered("staff", [device("abc")])).toBe(true);
  });

  it("is true when this browser enrolled even without a stored credential id", () => {
    markPasskeyOnThisDevice("staff");
    expect(isThisDeviceRegistered("staff", [device("other")])).toBe(true);
  });

  it("is false on a browser that has not enrolled, even if another device exists", () => {
    expect(isThisDeviceRegistered("staff", [device("abc")])).toBe(false);
  });

  it("clears both enrollment flags", () => {
    markPasskeyOnThisDevice("admin", "cred-1");
    clearPasskeyOnThisDevice("admin");
    expect(isThisDeviceRegistered("admin", [device("cred-1")])).toBe(false);
  });
});

describe("isAlreadyRegisteredError", () => {
  it("detects InvalidStateError and previously-registered messages", () => {
    const invalid = new Error("The authenticator was previously registered");
    invalid.name = "InvalidStateError";
    expect(isAlreadyRegisteredError(invalid)).toBe(true);
    expect(
      isAlreadyRegisteredError(new Error("The authenticator was previously registered.")),
    ).toBe(true);
    expect(isAlreadyRegisteredError(new Error("Cancelled"))).toBe(false);
  });
});
