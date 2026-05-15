export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function isCaptchaEnabled(): boolean {
  return TURNSTILE_SITE_KEY.length > 0;
}

export function isCaptchaRequiredError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("CAPTCHA_REQUIRED") ||
    error.message.includes("CAPTCHA verification required") ||
    error.message.includes("CAPTCHA verification failed")
  );
}
