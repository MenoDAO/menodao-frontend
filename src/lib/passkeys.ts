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

export interface PasskeyDevice {
  id: string;
  label: string | null;
  deviceType: string | null;
  createdAt: string;
  lastUsedAt: string | null;
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
