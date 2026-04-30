# Design Document: Performance & i18n Improvements

## Overview

This document covers the technical design for five related improvements to the MenoDAO platform:

1. Sign-up page performance optimisation (FCP ≤ 2 s, SSR, 150 KB JS budget)
2. Swahili i18n for the member dashboard and auth screens, with backend `preferredLanguage` persistence
3. Bilingual SMS notification templates in the NestJS SMS service
4. Swahili variant for the `menodao-landing` page with browser-language detection
5. Dashboard header layout fix for desktop/laptop viewports (≥ 1024 px)

The three apps involved are:

- `menodao-frontend` — Next.js 16 (App Router), React 19, Tailwind 4
- `menodao-landing` — Next.js 14, React 18, Tailwind 3
- `menodao-backend` — NestJS with Prisma (PostgreSQL)

---

## Architecture

### i18n Architecture

Both Next.js apps will use **`react-i18next`** (with `i18next`) for client-side translation. This library is already widely used with Next.js App Router, has no peer-dependency conflicts with either React 18 or 19, and supports lazy-loading of translation namespaces.

The `menodao-frontend` app will use a thin wrapper (`src/lib/i18n.ts`) that initialises `i18next` once and exposes a `useTranslation` hook. The `menodao-landing` app will use the same pattern.

A shared `detectLocale()` utility function encapsulates the locale-detection logic (localStorage → backend profile → `navigator.language` → default `en`) so it can be unit-tested independently of any React component.

```
menodao-frontend/
  src/
    lib/
      i18n.ts              ← i18next initialisation + detectLocale()
    locales/
      en.json              ← English strings (all screens)
      sw.json              ← Swahili strings (all screens)
    components/
      LanguageSwitcher.tsx ← Dropdown, writes localStorage + calls PATCH /members/profile

menodao-landing/
  app/
    lib/
      i18n.ts              ← i18next initialisation + detectLocale()
    locales/
      en.json
      sw.json
    components/
      LanguageSwitcher.tsx ← Dropdown, writes localStorage only (no backend)
```

### Sign-Up Page Performance Architecture

The sign-up page (`src/app/sign-up/page.tsx`) is currently a `"use client"` component, which means Next.js cannot SSR it. The fix is to convert the outer page shell to a Server Component and push the interactive form into a Client Component that is dynamically imported.

```
sign-up/
  page.tsx          ← Server Component: renders static shell + <Suspense>
  SignUpForm.tsx    ← Client Component: all interactive logic (dynamic import)
```

The background decoration blobs and logo are above-the-fold static content that can be inlined in the server-rendered shell. The heavy `KENYAN_COUNTIES` list and form validation logic stay in the client bundle but are code-split from the initial render.

### Backend preferredLanguage Architecture

The `Member` Prisma model gains a `preferredLanguage String? @default("en")` field. The `UpdateMemberDto` gains an optional `preferredLanguage` field. The SMS service gains a `SmsTemplateService` that holds the bilingual template catalogue and selects the correct variant at send time.

```
menodao-backend/
  prisma/
    schema.prisma          ← add preferredLanguage to Member
    migrations/            ← new migration
  src/
    members/
      dto/update-member.dto.ts  ← add preferredLanguage field
    notifications/
      sms-templates.ts          ← bilingual template catalogue
      sms.service.ts            ← updated to accept preferredLanguage
```

---

## Components and Interfaces

### LanguageSwitcher (menodao-frontend)

```tsx
// src/components/LanguageSwitcher.tsx
interface LanguageSwitcherProps {
  /** Called after locale is changed and persisted */
  onLocaleChange?: (locale: "en" | "sw") => void;
}
```

Renders a `<select>` (or button pair) showing "English / Kiswahili". On change:

1. Calls `i18n.changeLanguage(locale)`
2. Writes `localStorage.setItem('menodao_preferred_language', locale)`
3. Calls `PATCH /members/profile` with `{ preferredLanguage: locale }` (fire-and-forget, errors are logged but not surfaced to the user)

### detectLocale() utility

```ts
// src/lib/i18n.ts
type Locale = "en" | "sw";

/**
 * Determines the active locale using the following priority:
 * 1. localStorage key 'menodao_preferred_language'
 * 2. Provided backendLocale (from member profile)
 * 3. navigator.language (sw* → 'sw', otherwise 'en')
 * 4. Default: 'en'
 */
export function detectLocale(
  backendLocale?: string | null,
  navigatorLanguage?: string,
): Locale;
```

### SmsTemplateService (menodao-backend)

```ts
// src/notifications/sms-templates.ts
export type SmsTemplateKey =
  | "otp_verification"
  | "payment_confirmation"
  | "subscription_renewal_reminder"
  | "claim_status_update"
  | "welcome";

export interface SmsTemplateVars {
  [key: string]: string | number;
}

export interface BilingualTemplate {
  en: string;
  sw: string;
}

export type SmsTemplateCatalogue = Record<SmsTemplateKey, BilingualTemplate>;

export class SmsTemplateService {
  /**
   * Returns the rendered message for the given template key and language.
   * Falls back to English if the Swahili template is missing, and logs a warning.
   */
  render(
    key: SmsTemplateKey,
    preferredLanguage: string | null | undefined,
    vars: SmsTemplateVars,
  ): string;
}
```

The `SMSService.sendSMS()` signature is extended with an optional `preferredLanguage` parameter for callers that already have the member's language preference. A new `sendTemplatedSMS()` method accepts a template key, variables, and `preferredLanguage`.

### Dashboard Layout Changes

The `(dashboard)/layout.tsx` header `<nav>` currently uses `gap-1` with `px-3 py-2` per item. At 1024–1280 px the 8 nav items + user menu overflow. The fix:

- At `lg:` (≥ 1024 px): switch to `gap-0.5` and `px-2 py-2 text-xs` for nav items, use `whitespace-nowrap` on each label
- At `xl:` (≥ 1280 px): restore `gap-1 px-3 text-sm`
- Add `min-w-0 flex-shrink-0` to the user menu section so it never wraps
- Add `overflow-hidden` to the nav container so it clips rather than wraps

---

## Data Models

### Prisma: Member.preferredLanguage

```prisma
model Member {
  // ... existing fields ...
  preferredLanguage String? @default("en")
}
```

Migration: `20260000000000_add_preferred_language_to_member`

### UpdateMemberDto

```ts
export class UpdateMemberDto {
  @IsString() @IsOptional() fullName?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() preferredChain?: string;

  @IsString()
  @IsOptional()
  @IsIn(["en", "sw"])
  preferredLanguage?: string;
}
```

### Translation Catalogue Shape

Both apps use flat JSON files keyed by screen/component prefix:

```json
// en.json (excerpt)
{
  "nav.dashboard": "Dashboard",
  "nav.myPackage": "My Package",
  "nav.claims": "Claims",
  "nav.visits": "Visits",
  "nav.champion": "Champion",
  "nav.findClinic": "Find a Clinic",
  "nav.blockchain": "Blockchain",
  "nav.profile": "Profile",
  "nav.logout": "Logout",
  "auth.signUp.title": "Welcome to MenoDAO",
  "auth.signUp.subtitle": "Please provide the details below to continue",
  "auth.login.title": "Welcome Back",
  "auth.verifyOtp.title": "Verify Your Phone",
  "common.continue": "Continue",
  "common.loading": "Loading..."
}
```

```json
// sw.json (excerpt)
{
  "nav.dashboard": "Dashibodi",
  "nav.myPackage": "Pakiti Yangu",
  "nav.claims": "Madai",
  "nav.visits": "Ziara",
  "nav.champion": "Bingwa",
  "nav.findClinic": "Tafuta Kliniki",
  "nav.blockchain": "Blockchain",
  "nav.profile": "Wasifu",
  "nav.logout": "Toka",
  "auth.signUp.title": "Karibu MenoDAO",
  "auth.signUp.subtitle": "Tafadhali toa maelezo yafuatayo kuendelea",
  "auth.login.title": "Karibu Tena",
  "auth.verifyOtp.title": "Thibitisha Simu Yako",
  "common.continue": "Endelea",
  "common.loading": "Inapakia..."
}
```

### SMS Template Catalogue

```ts
export const SMS_TEMPLATES: SmsTemplateCatalogue = {
  otp_verification: {
    en: "Your MenoDAO verification code is {{code}}. Valid for 10 minutes.",
    sw: "Nambari yako ya uthibitisho wa MenoDAO ni {{code}}. Inatumika kwa dakika 10.",
  },
  payment_confirmation: {
    en: "Payment of KES {{amount}} received. Your MenoDAO {{tier}} membership is active.",
    sw: "Malipo ya KES {{amount}} yamepokelewa. Uanachama wako wa MenoDAO {{tier}} umewashwa.",
  },
  subscription_renewal_reminder: {
    en: "Your MenoDAO subscription renews on {{date}}. Ensure your M-Pesa is ready.",
    sw: "Usajili wako wa MenoDAO unafanywa upya tarehe {{date}}. Hakikisha M-Pesa yako iko tayari.",
  },
  claim_status_update: {
    en: "Your MenoDAO claim #{{claimId}} status: {{status}}.",
    sw: "Hali ya dai lako la MenoDAO #{{claimId}}: {{status}}.",
  },
  welcome: {
    en: "Welcome to MenoDAO, {{name}}! Your community dental cover is now active.",
    sw: "Karibu MenoDAO, {{name}}! Bima yako ya meno ya jamii imewashwa.",
  },
};
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Locale detection is deterministic

_For any_ combination of `localStorage` value, backend `preferredLanguage`, and `navigator.language` string, the `detectLocale()` function SHALL return `'sw'` if and only if the highest-priority non-null source starts with `'sw'`, and SHALL return `'en'` otherwise.

**Validates: Requirements 2.6, 4.2, 4.3**

### Property 2: Translation catalogue completeness

_For any_ key present in the English translation catalogue (`en.json`), the Swahili catalogue (`sw.json`) SHALL also contain that key with a non-empty string value.

**Validates: Requirements 2.3, 4.6**

### Property 3: SMS template language selection

_For any_ template key in the SMS catalogue and any `preferredLanguage` value, `SmsTemplateService.render()` SHALL return a string that matches the template for `'sw'` when `preferredLanguage === 'sw'`, and the template for `'en'` in all other cases (including `null`, `undefined`, and unrecognised values).

**Validates: Requirements 3.1, 3.2**

### Property 4: SMS template catalogue completeness

_For any_ key in the `SMS_TEMPLATES` catalogue, both the `en` and `sw` variants SHALL be non-empty strings.

**Validates: Requirements 3.3, 3.4**

### Property 5: localStorage locale persistence

_For any_ locale value in `['en', 'sw']`, after the `LanguageSwitcher` selects that locale, `localStorage.getItem('menodao_preferred_language')` SHALL equal that locale value.

**Validates: Requirements 2.9, 4.5**

### Property 6: Locale switch updates rendered text

_For any_ locale in `['en', 'sw']`, after switching to that locale via the `LanguageSwitcher`, every translated string rendered by the component tree SHALL match the corresponding entry in the translation catalogue for that locale.

**Validates: Requirements 2.2, 4.5**

### Property 7: Backend preferredLanguage round-trip

_For any_ locale value in `['en', 'sw']`, when a member's profile is fetched after saving `preferredLanguage`, the returned `preferredLanguage` field SHALL equal the value that was saved.

**Validates: Requirements 2.4, 2.5**

### Property 8: Dashboard header height invariant

_For any_ viewport width in the range [320, 1920] px, the dashboard header element SHALL have a computed height of exactly 64 px (h-16).

**Validates: Requirements 5.5**

---

## Error Handling

### i18n Missing Keys

Both apps configure `i18next` with `fallbackLng: 'en'` and a `missingKeyHandler` that calls `console.warn('[i18n] Missing key: <key> for locale: <locale>')`. This satisfies Requirements 2.3 fallback and 4.7.

### SMS Template Fallback

`SmsTemplateService.render()` checks for the existence of the `sw` variant before using it. If missing, it logs `[SMS] Missing Swahili template for key: <key>, falling back to English` and returns the English string. This satisfies Requirement 3.5.

### preferredLanguage API Failure

The `LanguageSwitcher` calls `PATCH /members/profile` fire-and-forget. If the call fails, the locale change is still applied locally (localStorage + i18next state). The error is logged to the console. The user experience is not degraded — the preference will be re-synced on the next successful profile save.

### Sign-Up Page Network Error

The `SignUpForm` client component wraps the `api.requestOtp()` call in a try/catch. On failure, it sets an error state that renders a visible error message and a "Try Again" button that re-submits the form. This satisfies Requirement 1.6.

### SSR Hydration

The `detectLocale()` function guards against `typeof window === 'undefined'` (SSR context) by skipping `localStorage` reads and returning the backend locale or `'en'`. This prevents hydration mismatches.

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

- `detectLocale()`: example-based tests covering all priority branches (localStorage wins, backend wins, navigator.language wins, default)
- `SmsTemplateService.render()`: example-based tests for each template key × each language, plus the missing-sw-key fallback edge case
- `LanguageSwitcher`: render test asserting it appears in the header and profile page; interaction test asserting localStorage is written on change
- Dashboard layout: render tests at 375 px, 900 px, 1024 px, 1280 px asserting correct nav visibility

### Property-Based Tests (fast-check)

`fast-check` is the property-based testing library for TypeScript/JavaScript. It integrates with Jest and requires no additional test runner.

Install: `npm install --save-dev fast-check` in both `menodao-frontend` and `menodao-backend`.

Each property test runs a minimum of 100 iterations.

Tag format: `// Feature: performance-and-i18n-improvements, Property <N>: <property_text>`

**Property 1 — detectLocale determinism** (`src/lib/i18n.test.ts`):
Generate arbitrary strings for `localStorage` value, `backendLocale`, and `navigator.language`. Assert the output is always `'sw'` or `'en'` and follows the priority rules.

**Property 2 — Translation catalogue completeness** (`src/locales/catalogue.test.ts`):
Iterate over all keys in `en.json` (the generator is the key set itself). Assert each key exists in `sw.json` with a non-empty value. (100 iterations = all keys.)

**Property 3 — SMS template language selection** (`src/notifications/sms-templates.test.ts`):
Generate arbitrary `preferredLanguage` strings and arbitrary template keys. Assert the returned string matches the expected language variant.

**Property 4 — SMS template catalogue completeness** (`src/notifications/sms-templates.test.ts`):
Iterate over all keys in `SMS_TEMPLATES`. Assert both `en` and `sw` are non-empty.

**Property 5 — localStorage locale persistence** (`src/components/LanguageSwitcher.test.tsx`):
Generate locale values from `['en', 'sw']`. Render the switcher, select the locale, assert localStorage value.

**Property 6 — Locale switch updates rendered text** (`src/components/LanguageSwitcher.test.tsx`):
Generate locale values. Render a component tree, switch locale, assert a sample of translated strings match the catalogue.

**Property 7 — Backend preferredLanguage round-trip** (`src/members/members.service.spec.ts`):
Generate locale values from `['en', 'sw']`. Call `update()` with `preferredLanguage`, then `findById()`, assert the returned value matches.

**Property 8 — Header height invariant** (`src/app/(dashboard)/layout.test.tsx`):
Generate viewport widths from [320, 1920]. Render the layout at each width, assert header height is 64 px.

### Integration / Smoke Tests

- Lighthouse CI (GitHub Actions): assert FCP ≤ 2000 ms on the sign-up page in mobile simulation mode (Requirement 1.1)
- Bundle size check: `next build` output — assert the sign-up route's JS chunks total ≤ 150 KB gzip (Requirement 1.3)
- SSR check: fetch `/sign-up` without JS and assert the form heading is present in the HTML response (Requirement 1.2)
