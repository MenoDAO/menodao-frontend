import { parseApiError } from "../parse-api-error";

describe("parseApiError", () => {
  it("parses wrapped production error responses", () => {
    const parsed = parseApiError(
      {
        success: false,
        error: {
          code: "CAPTCHA_INVALID",
          message: "CAPTCHA verification failed. Please try again.",
        },
      },
      403,
    );

    expect(parsed.message).toBe(
      "CAPTCHA verification failed. Please try again.",
    );
    expect(parsed.code).toBe("CAPTCHA_INVALID");
  });

  it("parses legacy NestJS error responses", () => {
    const parsed = parseApiError(
      { message: "Invalid or expired OTP", code: "AUTHENTICATION_ERROR" },
      401,
    );

    expect(parsed.message).toBe("Invalid or expired OTP");
    expect(parsed.code).toBe("AUTHENTICATION_ERROR");
  });

  it("falls back to HTTP status when message is missing", () => {
    const parsed = parseApiError({}, 503, "Request failed");
    expect(parsed.message).toBe("Request failed");
  });
});
