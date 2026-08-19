import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export { browserSupportsWebAuthn };

export type PasskeyKind = "staff" | "admin" | "member";

export interface PasskeyDevice {
  id: string;
  label: string | null;
  deviceType: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

function enrolledKey(kind: PasskeyKind) {
  return `menodao.passkey.${kind}`;
}

function autoStartKey(kind: PasskeyKind) {
  return `menodao.passkey.autostart.${kind}`;
}

export function hasPasskeyOnThisDevice(kind: PasskeyKind): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(enrolledKey(kind)) === "1";
}

export function markPasskeyOnThisDevice(kind: PasskeyKind) {
  if (typeof window === "undefined") return;
  localStorage.setItem(enrolledKey(kind), "1");
}

export function clearPasskeyOnThisDevice(kind: PasskeyKind) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(enrolledKey(kind));
}

export function shouldAutoStartPasskey(kind: PasskeyKind): boolean {
  if (typeof window === "undefined") return false;
  if (!hasPasskeyOnThisDevice(kind) || !browserSupportsWebAuthn()) return false;
  if (sessionStorage.getItem(autoStartKey(kind))) return false;
  sessionStorage.setItem(autoStartKey(kind), "1");
  return true;
}

export async function completePasskeyLogin<T>(
  getOptions: (
    username?: string,
  ) => Promise<PublicKeyCredentialRequestOptionsJSON>,
  verify: (credential: AuthenticationResponseJSON) => Promise<T>,
  username?: string,
): Promise<T> {
  if (!browserSupportsWebAuthn()) {
    throw new Error("This browser does not support fingerprint or Face ID login.");
  }
  const optionsJSON = await getOptions(username);
  const credential = await startAuthentication({ optionsJSON });
  return verify(credential);
}

export async function registerThisDevice(
  getOptions: () => Promise<PublicKeyCredentialCreationOptionsJSON>,
  verify: (
    credential: RegistrationResponseJSON,
    label?: string,
  ) => Promise<unknown>,
): Promise<void> {
  if (!browserSupportsWebAuthn()) {
    throw new Error("This browser does not support fingerprint or Face ID login.");
  }
  const optionsJSON = await getOptions();
  const credential = await startRegistration({ optionsJSON });
  await verify(credential, navigator.platform || "This device");
}
