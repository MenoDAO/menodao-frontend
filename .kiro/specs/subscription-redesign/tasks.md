# Implementation Plan: Subscription Page Redesign

## Overview

Implement the glass morphism subscription page redesign across two repos: backend Dependant model + API endpoints (NestJS/Prisma), then frontend glass cards, DependantManager, MenoAITeaser, animations, and i18n.

## Tasks

- [x] 1. Backend — Prisma Dependant model and migration
  - Add `Dependant` model to `menodao-backend/prisma/schema.prisma` with fields: `id` (UUID), `memberId` (FK to Member), `fullName` (String), `relationship` (String), `createdAt`, `updatedAt`
  - Add `dependants Dependant[]` relation field to the `Member` model
  - Add `@@index([memberId])` to the Dependant model
  - Generate and apply a new Prisma migration
  - _Requirements: 5.1, 5.2_

- [x] 2. Backend — CreateDependantDto and service methods
  - [x] 2.1 Create `menodao-backend/src/members/dto/create-dependant.dto.ts`
    - Fields: `fullName` (`@IsString @IsNotEmpty @MaxLength(100)`), `relationship` (`@IsIn(['Parent/Child'])`)
    - _Requirements: 5.3_

  - [x] 2.2 Add `addDependant` and `getDependants` to `MembersService`
    - `addDependant`: find active subscription, reject BRONZE/none with 400, count existing dependants, enforce SILVER=1/GOLD=2 limits with tier-specific error messages, then `prisma.dependant.create`
    - `getDependants`: return `prisma.dependant.findMany({ where: { memberId } })`
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]\* 2.3 Write property test for `MembersService.addDependant` — coverage rule enforcement
    - **Property 6: Coverage rule is enforced server-side for all members**
    - **Validates: Requirements 5.3, 5.5**

  - [ ]\* 2.4 Write property test for `MembersService.getDependants` — returns all stored dependants
    - **Property 7: GET /members/dependants returns all stored dependants**
    - **Validates: Requirements 5.4**

  - [ ]\* 2.5 Write unit tests for `MembersService` — specific examples
    - Test: rejects BRONZE member; rejects SILVER at limit (1); rejects GOLD at limit (2); creates record for eligible SILVER/GOLD member; `getDependants` returns only records for the requesting member
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 3. Backend — MembersController routes
  - Add `POST /members/dependants` and `GET /members/dependants` routes to `menodao-backend/src/members/members.controller.ts` under the existing `JwtAuthGuard`
  - Extract `memberId` from `req.user` and delegate to the service methods
  - _Requirements: 5.3, 5.4_

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Frontend — CSS animation keyframes
  - Add `@keyframes fade-slide-up` and `.animate-fade-slide-up` to `menodao-frontend/src/app/globals.css`
  - Add `@keyframes fade-in` and `.animate-fade-in` for dependant list item entrance
  - _Requirements: 7.1, 7.3_

- [x] 6. Frontend — api.ts additions
  - Add `Dependant` TypeScript interface to `menodao-frontend/src/lib/api.ts`
  - Add `addDependant(data: { fullName: string; relationship: string })` method calling `POST /members/dependants`
  - Add `getDependants()` method calling `GET /members/dependants`
  - _Requirements: 5.6_

- [x] 7. Frontend — i18n keys
  - Add all new translation keys to `menodao-frontend/src/locales/en.json`: package card coverage labels (`subscription.coverage.bronze/silver/gold`), Dependant Manager labels/errors, MenoAI teaser copy, "Recommended"/"Current Plan" badges, upgrade note for BRONZE
  - Add matching Swahili translations for all new keys to `menodao-frontend/src/locales/sw.json`
  - _Requirements: 2.4, 3.9, 6.6, 8.1, 8.2_

  - [ ]\* 7.1 Write property test for i18n key completeness
    - **Property 8: All i18n keys used in new components exist in both locale files**
    - **Validates: Requirements 8.1, 8.2**

- [x] 8. Frontend — Subscription page glass card redesign (`page.tsx`)
  - Rewrite `menodao-frontend/src/app/(dashboard)/dashboard/subscription/page.tsx` to render three `PackageCard` inline components in a responsive grid (1-col mobile, 3-col desktop)
  - Apply glass morphism base classes (`backdrop-blur-md bg-white/10 dark:bg-gray-900/40 border rounded-2xl`) and tier-specific colour palettes (amber/BRONZE, slate/SILVER, yellow/GOLD)
  - Apply staggered entrance animation via `animate-fade-slide-up` with `animationDelay: index * 100ms` inline style
  - Apply `hover:scale-105 hover:shadow-xl transition-all duration-200` on non-current-plan cards
  - Show "Recommended" badge on GOLD when member has no active subscription; show "Current Plan" badge on the active tier card
  - Show upgrade note for BRONZE subscribers (i18n key)
  - Render `DependantManager` only when `subscription?.isActive && subscription.tier !== 'BRONZE'`
  - Render `MenoAITeaser` always, below DependantManager (or below cards if no manager)
  - Use `useTranslation` for all user-facing strings
  - _Requirements: 1.1–1.8, 2.1–2.5, 7.1, 7.2, 8.4_

  - [ ]\* 8.1 Write unit tests for `page.tsx`
    - Test: renders three cards; GOLD has "Recommended" badge when no subscription; active tier card has "Current Plan" badge; BRONZE subscription shows upgrade note; DependantManager absent for BRONZE; DependantManager present for SILVER/GOLD
    - _Requirements: 1.5, 1.6, 2.5, 3.1, 3.8_

  - [ ]\* 8.2 Write property test for DependantManager visibility
    - **Property 1: DependantManager visibility is determined by subscription tier**
    - **Validates: Requirements 3.1, 3.8**

- [x] 9. Frontend — DependantManager component
  - Create `menodao-frontend/src/app/(dashboard)/dashboard/subscription/DependantManager.tsx`
  - Props: `{ tier: 'SILVER' | 'GOLD' }`
  - Use `useQuery(['dependants'], api.getDependants)` for the list; show loading skeleton/spinner while loading; show "No dependants added yet" (i18n) when empty
  - Display `{count} / {TIER_MAX[tier]}` counter
  - Controlled form with `fullName` text input and `relationship` dropdown (only "Parent/Child")
  - Client-side validation: reject empty/whitespace names with inline error (i18n key), no API call
  - Use `useMutation(api.addDependant, { onSuccess: () => queryClient.invalidateQueries(['dependants']) })`
  - Display API error messages returned from the server in the form
  - New list items animate in with `animate-fade-in`
  - All labels and error messages via `useTranslation`
  - _Requirements: 3.1–3.9, 4.1–4.5, 7.3_

  - [ ]\* 9.1 Write property test for whitespace/empty name rejection
    - **Property 3: Whitespace and empty names are rejected client-side**
    - **Validates: Requirements 3.5**

  - [ ]\* 9.2 Write property test for dependant list rendering
    - **Property 4: All dependants in the list are rendered with correct data**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]\* 9.3 Write property test for dependant count display
    - **Property 5: Dependant count display reflects tier maximum**
    - **Validates: Requirements 4.5**

  - [ ]\* 9.4 Write property test for valid dependant submission
    - **Property 2: Valid dependant submission creates a matching record**
    - **Validates: Requirements 3.4**

  - [ ]\* 9.5 Write unit tests for `DependantManager.tsx`
    - Test: renders form fields; empty name shows validation error; whitespace-only name shows validation error; loading state shows spinner; empty list shows empty state; list renders correct count/max for SILVER and GOLD
    - _Requirements: 3.2, 3.3, 3.5, 4.3, 4.4, 4.5_

- [x] 10. Frontend — MenoAITeaser component
  - Create `menodao-frontend/src/app/(dashboard)/dashboard/subscription/MenoAITeaser.tsx`
  - Stateless, no props; uses `useTranslation`
  - Glass card with emerald gradient accent (`backdrop-blur-md bg-emerald-500/10 dark:bg-emerald-900/20 border border-emerald-400/30 rounded-2xl`)
  - Display "Coming Soon" badge, headline, description (i18n keys), WhatsApp icon
  - State that all tiers (Bronze, Silver, Gold) get access when launched
  - Disabled "Coming Soon" button (`disabled`, `opacity-50 cursor-not-allowed`)
  - Viewport entrance animation via `animate-fade-slide-up` with `animation-delay: 300ms`
  - _Requirements: 6.1–6.7, 7.4_

  - [ ]\* 10.1 Write unit tests for `MenoAITeaser.tsx`
    - Test: renders "Coming Soon" badge; button is disabled; WhatsApp icon present; headline and description render via i18n keys
    - _Requirements: 6.2, 6.3, 6.7_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Backend tasks (1–4) should be completed before frontend API integration (6+)
- The `PaymentDialog.tsx` component is unchanged
- Coverage limit enforcement is server-side only; the frontend displays errors returned by the API
- Property tests use fast-check (frontend) and the existing Jest setup (backend)
