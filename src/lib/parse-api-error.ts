export interface ParsedApiError {
  message: string;
  code?: string;
}

/**
 * Normalize API error bodies from both legacy NestJS and wrapped formats:
 * - { message: "...", code: "..." }
 * - { success: false, error: { message: "...", code: "..." } }
 */
export function parseApiError(
  body: unknown,
  status: number,
  fallback = "Request failed",
): ParsedApiError {
  if (!body || typeof body !== "object") {
    return { message: fallback };
  }

  const record = body as Record<string, unknown>;
  const wrapped =
    record.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : null;

  const source = wrapped ?? record;
  const rawMessage = source.message;
  const code =
    typeof source.code === "string"
      ? source.code
      : typeof record.code === "string"
        ? record.code
        : undefined;

  let message: string;
  if (typeof rawMessage === "string") {
    message = rawMessage;
  } else if (Array.isArray(rawMessage)) {
    message = rawMessage.join(", ");
  } else if (
    rawMessage &&
    typeof rawMessage === "object" &&
    typeof (rawMessage as Record<string, unknown>).message === "string"
  ) {
    message = (rawMessage as Record<string, string>).message;
  } else {
    message = fallback;
  }

  return {
    message: message || code || `HTTP ${status}`,
    code,
  };
}
