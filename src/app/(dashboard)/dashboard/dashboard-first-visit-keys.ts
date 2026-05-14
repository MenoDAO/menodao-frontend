/** First dashboard visit: user confirmed app language (then onboarding may run). */
export function dashboardLanguageConfirmKey(memberId: string) {
  return `menodao-dashboard-first-lang-v1:${memberId}`;
}

export function dashboardOnboardingKey(memberId: string) {
  return `menodao-dashboard-onboarding-v1:${memberId}`;
}
