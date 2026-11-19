/**
 * Helpers for remembering where a user was trying to go when an auth guard
 * bounced them to a login page.
 *
 * The convention everywhere is a single `callbackUrl` query parameter holding
 * a same-site relative path. Guards produce it, login/captcha pages consume it.
 */

/** The path (including query string) the browser is currently on. */
export function currentAppPath(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

/** The `callbackUrl` currently in the address bar, if any. */
export function currentCallbackUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("callbackUrl");
}

/**
 * Append `?callbackUrl=<currentPath>` to a destination (a login page, or the
 * captcha interstitial on the way to one).
 *
 * The current path is sanitised first: only same-site relative paths are kept,
 * so a crafted link such as `?callbackUrl=https://evil.example` cannot bounce
 * the user off-site after they authenticate. Anything unsafe falls back to the
 * bare destination.
 */
export function withCallbackUrl(
  destinationPath: string,
  currentPath: string,
): string {
  const target = sanitizeCallbackUrl(currentPath);
  if (!target || target.split(/[?#]/)[0] === destinationPath) {
    return destinationPath;
  }
  return `${destinationPath}?callbackUrl=${encodeURIComponent(target)}`;
}

/**
 * Read a `callbackUrl` value and return a safe destination, or `fallback`
 * when it is missing or unsafe.
 */
export function resolveCallbackUrl(
  value: string | null | undefined,
  fallback: string,
): string {
  return sanitizeCallbackUrl(value) ?? fallback;
}

/**
 * Keep only a same-site relative path. Rejects absolute URLs, protocol-relative
 * (`//host`), backslash (`/\host`) and control characters - checked in both the
 * raw and percent-decoded form, since the value may be double-encoded.
 */
export function sanitizeCallbackUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const decoded = decodeSafely(raw);
  if (!isInternalPath(raw) || !isInternalPath(decoded)) return null;
  return raw;
}

function decodeSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isInternalPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  // `//host` and `/\host` are treated as protocol-relative by browsers.
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return false;
  }
  return true;
}
