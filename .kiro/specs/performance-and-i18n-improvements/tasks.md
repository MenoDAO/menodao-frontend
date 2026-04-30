# Implementation Plan: Performance & i18n Improvements

## Overview

Sequential implementation across three apps: `menodao-backend` (Prisma + SMS templates), `menodao-frontend` (i18n, sign-up SSR, header fix), and `menodao-landing` (i18n). Each phase builds on the previous so that the backend language preference is available before the frontend consumes it.

## Tasks

- [x] 1. Backend: Add `preferredLanguage` to Prisma Member model
  - [x] 1.1 Add `preferredLanguage String? @default("en")` field to the `Member` model in `menodao-backend/prisma/schema.prisma`
    - Insert after the `preferredChain` field
    - _Requirements: 2.4, 2.5, 3.1, 3.2_
  - [x] 1.2 Create and run Prisma migration for the new field
    - Run `npx prisma migrate dev --name add_preferred_language_to_member` inside `menodao-backend/`
    - Verify the generated SQL adds a nullable column with default `'en'`
    - _Requirements: 2.4_

- [x] 2. Backend: Extend `UpdateMemberDto` and validate `preferredLanguage`
  - [x] 2.1 Add `preferredLanguage` field to `menodao-backend/src/members/dto/update-member.dto.ts`
    - Import `IsIn` from `class-validator`
    - Add `@IsString() @IsOptional() @IsIn(['en', 'sw']) preferredLanguage?: string;` with `@ApiPropertyOptional`
    - _Requirements: 2.4_
  - [x] 2.2 Write property test for `preferredLanguage` round-trip in `menodao-backend/src/members/members.service.spec.ts`
    - Install `fast-check` as a dev dependency in `menodao-backend/`: `npm install --save-dev fast-check`
    - **Property 7: Backend preferredLanguage round-trip**
    - Generate locale values from `['en', 'sw']` using `fc.constantFrom('en', 'sw')`
    - Call `update()` with `{ preferredLanguage }`, then `findById()`, assert returned `preferredLanguage` equals the saved value
    - Tag: `// Feature: performance-and-i18n-improvements, Property 7: Backend preferredLanguage round-trip`
    - **Validates: Requirements 2.4, 2.5**

- [x] 3. Backend: Create `SmsTemplateService` with bilingual catalogue
  - [x] 3.1 Create `menodao-backend/src/notifications/sms-templates.ts`
    - Export types: `SmsTemplateKey`, `SmsTemplateVars`, `BilingualTemplate`, `SmsTemplateCatalogue`
    - Export `SMS_TEMPLATES` constant with all 5 template keys (`otp_verification`, `payment_confirmation`, `subscription_renewal_reminder`, `claim_status_update`, `welcome`), each with `en` and `sw` variants using `{{variable}}` interpolation syntax
    - Export `SmsTemplateService` class with `render(key, preferredLanguage, vars): string` method
    - `render()` must: select `sw` variant when `preferredLanguage === 'sw'`, fall back to `en` for all other values (including `null`/`undefined`), interpolate `vars` into the template string, log a warning if the `sw` variant is missing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.2 Write property tests for SMS template service in `menodao-backend/src/notifications/sms-templates.spec.ts`
    - **Property 3: SMS template language selection**
    - Generate arbitrary `preferredLanguage` strings and arbitrary `SmsTemplateKey` values; assert `render()` returns the `sw` template content when `preferredLanguage === 'sw'` and the `en` content otherwise
    - Tag: `// Feature: performance-and-i18n-improvements, Property 3: SMS template language selection`
    - **Validates: Requirements 3.1, 3.2**
    - **Property 4: SMS template catalogue completeness**
    - Iterate over all keys in `SMS_TEMPLATES`; assert both `en` and `sw` variants are non-empty strings
    - Tag: `// Feature: performance-and-i18n-improvements, Property 4: SMS template catalogue completeness`
    - **Validates: Requirements 3.3, 3.4**

- [x] 4. Backend: Integrate `SmsTemplateService` into `SMSService`
  - [x] 4.1 Update `menodao-backend/src/notifications/sms.service.ts` to use `SmsTemplateService`
    - Import and instantiate `SmsTemplateService` inside `SMSService`
    - Add `sendTemplatedSMS(phone: string, key: SmsTemplateKey, vars: SmsTemplateVars, preferredLanguage?: string | null): Promise<DeliveryResult>` method that calls `smsTemplateService.render()` then `this.sendSMS()`
    - Extend the existing `sendSMS()` signature with an optional `preferredLanguage?: string` parameter (no breaking change — existing callers pass no language and get English)
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 5. Checkpoint — Backend tests pass
  - Run `npm test` inside `menodao-backend/` and ensure all existing tests plus the new property tests pass. Ask the user if any issues arise.

- [x] 6. Frontend (menodao-frontend): Install dependencies and create i18n foundation
  - [x] 6.1 Install `react-i18next` and `i18next` in `menodao-frontend/`
    - Run `npm install react-i18next i18next` inside `menodao-frontend/`
    - _Requirements: 2.1_
  - [x] 6.2 Install `fast-check` as a dev dependency in `menodao-frontend/`
    - Run `npm install --save-dev fast-check` inside `menodao-frontend/`
  - [x] 6.3 Create `menodao-frontend/src/lib/i18n.ts`
    - Initialise `i18next` with `react-i18next`, `fallbackLng: 'en'`, `lng: 'en'`, `resources` pointing to the locale JSON files, and a `missingKeyHandler` that calls `console.warn('[i18n] Missing key: <key> for locale: <locale>')`
    - Export `detectLocale(backendLocale?: string | null, navigatorLanguage?: string): 'en' | 'sw'` — priority: `localStorage.getItem('menodao_preferred_language')` → `backendLocale` → `navigatorLanguage` (starts with `'sw'` → `'sw'`) → default `'en'`; guard `typeof window === 'undefined'` for SSR
    - Export the initialised `i18n` instance and re-export `useTranslation` from `react-i18next`
    - _Requirements: 2.1, 2.6, 2.9_

- [x] 7. Frontend (menodao-frontend): Create translation catalogues
  - [x] 7.1 Create `menodao-frontend/src/locales/en.json`
    - Include all keys for: nav items (`nav.*`), auth screens (`auth.signUp.*`, `auth.login.*`, `auth.verifyOtp.*`), dashboard home (`dashboard.*`), subscription (`subscription.*`), claims (`claims.*`), visits history (`visits.*`), champion (`champion.*`), find-a-clinic (`clinic.*`), blockchain transactions (`blockchain.*`), profile (`profile.*`), and shared strings (`common.*`)
    - _Requirements: 2.3_
  - [x] 7.2 Create `menodao-frontend/src/locales/sw.json`
    - Mirror every key from `en.json` with accurate Swahili translations
    - _Requirements: 2.3_
  - [x] 7.3 Write property test for translation catalogue completeness in `menodao-frontend/src/locales/catalogue.test.ts`
    - **Property 2: Translation catalogue completeness**
    - Import both JSON files; iterate over all keys in `en.json`; assert each key exists in `sw.json` with a non-empty string value
    - Tag: `// Feature: performance-and-i18n-improvements, Property 2: Translation catalogue completeness`
    - **Validates: Requirements 2.3, 4.6**

- [x] 8. Frontend (menodao-frontend): Create `LanguageSwitcher` component
  - [x] 8.1 Create `menodao-frontend/src/components/LanguageSwitcher.tsx`
    - Client component (`"use client"`)
    - Renders a `<select>` with options `{ value: 'en', label: 'English' }` and `{ value: 'sw', label: 'Kiswahili' }`
    - On change: calls `i18n.changeLanguage(locale)`, writes `localStorage.setItem('menodao_preferred_language', locale)`, fires `PATCH /members/profile` with `{ preferredLanguage: locale }` fire-and-forget (catch and `console.error` on failure)
    - Accepts optional `onLocaleChange?: (locale: 'en' | 'sw') => void` prop
    - _Requirements: 2.2, 2.4, 2.7, 2.8, 2.9_
  - [x] 8.2 Write property tests for `LanguageSwitcher` in `menodao-frontend/src/components/LanguageSwitcher.test.tsx`
    - **Property 5: localStorage locale persistence**
    - Generate locale values from `fc.constantFrom('en', 'sw')`; render the switcher, simulate selecting the locale, assert `localStorage.getItem('menodao_preferred_language')` equals the selected locale
    - Tag: `// Feature: performance-and-i18n-improvements, Property 5: localStorage locale persistence`
    - **Validates: Requirements 2.9, 4.5**
    - **Property 6: Locale switch updates rendered text**
    - Generate locale values; render a component tree wrapped in the i18n provider, switch locale via the switcher, assert a sample of translated strings match the catalogue entry for that locale
    - Tag: `// Feature: performance-and-i18n-improvements, Property 6: Locale switch updates rendered text`
    - **Validates: Requirements 2.2, 4.5**

- [x] 9. Frontend (menodao-frontend): Add `LanguageSwitcher` to dashboard layout and apply i18n
  - [x] 9.1 Update `menodao-frontend/src/app/(dashboard)/layout.tsx` to integrate i18n and `LanguageSwitcher`
    - Wrap the layout in the `I18nextProvider` (or use the initialised `i18n` instance) so all child components can call `useTranslation()`
    - On mount, call `detectLocale(member?.preferredLanguage)` and apply the result via `i18n.changeLanguage()`
    - Add `<LanguageSwitcher />` to the desktop user menu section, to the right of the member name display (before `ThemeToggle`), visible on viewports ≥ 768 px
    - Replace all hard-coded nav label strings in `navItems` with `t('nav.<key>')` translation keys
    - _Requirements: 2.2, 2.5, 2.6, 2.7_
  - [x] 9.2 Wrap text strings in dashboard home, subscription, claims, visits, champion, find-a-clinic, blockchain, and profile pages with `useTranslation()` hooks
    - Import `useTranslation` from `@/lib/i18n` in each page component
    - Replace user-visible string literals with `t('key')` calls matching the keys in `en.json`/`sw.json`
    - _Requirements: 2.2, 2.3_
  - [x] 9.3 Add `LanguageSwitcher` to the profile page settings section
    - Locate the profile settings card in `menodao-frontend/src/app/(dashboard)/dashboard/profile/` (or equivalent)
    - Render `<LanguageSwitcher />` inside the settings section
    - _Requirements: 2.8_

- [x] 10. Frontend (menodao-frontend): Fix dashboard header layout for desktop
  - [x] 10.1 Update the desktop `<nav>` in `menodao-frontend/src/app/(dashboard)/layout.tsx` to prevent text wrapping at lg/xl breakpoints
    - Change nav container from `gap-1` to `lg:gap-0.5 xl:gap-1`
    - Change each nav item link from `px-3 py-2 text-sm` to `lg:px-2 lg:py-2 lg:text-xs xl:px-3 xl:text-sm`
    - Add `whitespace-nowrap` to each nav item link
    - Add `min-w-0 flex-shrink-0` to the user menu `<div>` so it never wraps
    - Add `overflow-hidden` to the nav container `<div>`
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 10.2 Write property test for dashboard header height invariant in `menodao-frontend/src/app/(dashboard)/layout.test.tsx`
    - **Property 8: Dashboard header height invariant**
    - Generate viewport widths from `fc.integer({ min: 320, max: 1920 })`; render the layout at each width; assert the header element has a computed height of 64 px
    - Tag: `// Feature: performance-and-i18n-improvements, Property 8: Dashboard header height invariant`
    - **Validates: Requirements 5.5**

- [x] 11. Frontend (menodao-frontend): Wrap auth screens with i18n
  - [x] 11.1 Update `menodao-frontend/src/app/login/page.tsx` to use `useTranslation()`
    - Import `useTranslation` from `@/lib/i18n`
    - Replace the heading "Welcome Back", subheading, button labels, and error strings with `t('auth.login.*')` and `t('common.*')` keys
    - _Requirements: 2.2, 2.3_
  - [x] 11.2 Update `menodao-frontend/src/app/verify-otp/page.tsx` to use `useTranslation()`
    - Replace heading "Verify Your Phone", labels, button text, and error strings with `t('auth.verifyOtp.*')` and `t('common.*')` keys
    - _Requirements: 2.2, 2.3_

- [x] 12. Frontend (menodao-frontend): Convert sign-up page to SSR + dynamic import
  - [x] 12.1 Extract the interactive form from `menodao-frontend/src/app/sign-up/page.tsx` into `menodao-frontend/src/app/sign-up/SignUpForm.tsx`
    - Move the entire `SignUpForm` function (all state, handlers, and JSX) into the new file
    - Add `"use client"` directive at the top
    - Export as default
    - Apply `useTranslation()` to replace heading, subtitle, field labels, button text, and error strings with `t('auth.signUp.*')` and `t('common.*')` keys
    - _Requirements: 1.2, 1.3, 2.2, 2.3_
  - [x] 12.2 Rewrite `menodao-frontend/src/app/sign-up/page.tsx` as a Server Component
    - Remove `"use client"` directive
    - Remove all imports that are client-only (`useState`, `useEffect`, `useRouter`, etc.)
    - Render the static above-the-fold shell (background gradient, logo, MenoDAO heading, "Member Portal" subtitle) as server-rendered HTML
    - Dynamically import `SignUpForm` with `next/dynamic` and `{ ssr: false }` wrapped in a `<Suspense>` fallback showing the card skeleton
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 13. Checkpoint — Frontend (menodao-frontend) tests pass
  - Run `npx jest --run` inside `menodao-frontend/` and ensure all tests pass, including the new property tests. Ask the user if any issues arise.

- [x] 14. Frontend (menodao-frontend): Write `detectLocale` property test
  - [x] 14.1 Create `menodao-frontend/src/lib/i18n.test.ts`
    - **Property 1: Locale detection is deterministic**
    - Generate arbitrary strings for `localStorage` value, `backendLocale`, and `navigatorLanguage` using `fc.string()`
    - Assert output is always `'en'` or `'sw'`
    - Assert priority rules: if `localStorage` value is `'sw'` → output is `'sw'`; if `localStorage` is absent/invalid and `backendLocale` is `'sw'` → output is `'sw'`; if both absent and `navigatorLanguage` starts with `'sw'` → output is `'sw'`; otherwise `'en'`
    - Tag: `// Feature: performance-and-i18n-improvements, Property 1: Locale detection is deterministic`
    - **Validates: Requirements 2.6, 4.2, 4.3**

- [x] 15. Landing page (menodao-landing): Install dependencies and create i18n foundation
  - [x] 15.1 Install `react-i18next` and `i18next` in `menodao-landing/`
    - Run `npm install react-i18next i18next` inside `menodao-landing/`
    - _Requirements: 4.1_
  - [x] 15.2 Create `menodao-landing/app/lib/i18n.ts`
    - Same pattern as `menodao-frontend/src/lib/i18n.ts` but without the backend profile step
    - `detectLocale(navigatorLanguage?: string): 'en' | 'sw'` — priority: `localStorage.getItem('menodao_preferred_language')` → `navigatorLanguage` (starts with `'sw'` → `'sw'`) → default `'en'`; guard SSR
    - Initialise `i18next` with `fallbackLng: 'en'` and `missingKeyHandler` warning
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [x] 16. Landing page (menodao-landing): Create translation catalogues
  - [x] 16.1 Create `menodao-landing/app/locales/en.json`
    - Include keys for all user-visible text sections: navigation links, hero section, M-Pesa trust badge, partner clinics section, CEO message, plan comparison, how-it-works modal, testimonials, gallery captions, contact section, and footer
    - _Requirements: 4.6_
  - [x] 16.2 Create `menodao-landing/app/locales/sw.json`
    - Mirror every key from `en.json` with accurate Swahili translations
    - _Requirements: 4.6_

- [x] 17. Landing page (menodao-landing): Create `LanguageSwitcher` and integrate i18n
  - [x] 17.1 Create `menodao-landing/app/components/LanguageSwitcher.tsx`
    - Client component (`"use client"`)
    - Renders a `<select>` or button pair with "English / Kiswahili"
    - On change: calls `i18n.changeLanguage(locale)` and writes `localStorage.setItem('menodao_preferred_language', locale)` (no backend call — landing page has no auth)
    - _Requirements: 4.4, 4.5_
  - [x] 17.2 Update `menodao-landing/app/page.tsx` to integrate i18n
    - Wrap the page in `I18nextProvider` (or use the initialised `i18n` instance)
    - On mount, call `detectLocale(navigator.language)` and apply via `i18n.changeLanguage()`
    - Replace all user-visible string literals in all sections with `t('key')` calls matching the keys in `en.json`/`sw.json`
    - Add `<LanguageSwitcher />` to the desktop nav (after the existing nav links, before the "Get Started" CTA button) and to the mobile menu
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 18. Final checkpoint — All tests pass
  - Run `npx jest --run` in `menodao-frontend/` and `npm test` in `menodao-backend/`. Ensure all tests pass. Ask the user if any issues arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP — none are marked optional here because the user requested all property tests as required
- Each task references specific requirements for traceability
- Checkpoints at tasks 5, 13, and 18 ensure incremental validation
- Property tests use `fast-check` and must be tagged with the feature name and property number as specified in the design
- The sign-up page SSR conversion (task 12) is a structural refactor — the existing `SignUpForm` function body moves unchanged into `SignUpForm.tsx`; only the outer `page.tsx` shell changes
