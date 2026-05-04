# Implementation Plan: Payment and UX Improvements

## Overview

Targeted fixes across the payment flow and dashboard UI: enforce payment-confirmation-gated claim limit updates, strip debug console.log statements, fix mobile layout in PaymentDialog, standardise tier naming to MenoBronze/MenoSilver/MenoGold, surface the checkout amount on the phone-entry screen, and bring WaitingPeriodDisplay up to WCAG AA contrast.

## Tasks

- [x] 1. Enforce payment-confirmation-gated claim limit updates
  - [x] 1.1 Audit `claim-limits.ts` and `PaymentDialog.tsx` for any code path that updates or exposes a new claim limit before `onPaymentComplete` fires
    - Confirm `getClaimLimit` / `getRemainingClaimLimit` are pure read functions and do not mutate state
    - Confirm `onPaymentComplete` is the sole trigger for any post-payment entitlement refresh in the parent page (`subscription/page.tsx`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Guard the `onPaymentComplete` callback so it is only invoked when `paymentStatus === "COMPLETED"` (i.e. after a confirmed `COMPLETED` status from the polling loop)
    - Remove any early / optimistic calls to `onPaymentComplete` that fire before confirmation
    - Ensure navigation-away during `PENDING` state does not trigger entitlement changes
    - _Requirements: 1.1, 1.3, 1.4_
  - [ ]\* 1.3 Write unit tests for payment-confirmation guard
    - Test that `onPaymentComplete` is NOT called when status is `STARTED` or `PENDING`
    - Test that `onPaymentComplete` IS called exactly once when status transitions to `COMPLETED`
    - Test that navigating away (calling `handleClose`) during `PENDING` does not invoke `onPaymentComplete`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Remove debug console.log statements from frontend components
  - [x] 2.1 Remove all `console.log` calls from `PaymentDialog.tsx`
    - Remove the `[PaymentDialog] Initiating payment:` log in `paymentMutation.mutationFn`
    - Remove the `[PaymentDialog] Frequency selected:` log in `handleFrequencySelect`
    - Retain the `console.error` in the status-check catch block (legitimate error logging)
    - _Requirements: 2.2_
  - [x] 2.2 Scan and remove `console.log` from other frontend components in scope
    - Search `PaymentFrequencySelector.tsx`, `PaymentBenefitsComparison.tsx`, `WaitingPeriodDisplay.tsx`, and `subscription/page.tsx` for any `console.log` calls and remove them
    - _Requirements: 2.1, 2.2_

- [x] 3. Fix PaymentDialog responsive layout
  - [x] 3.1 Remove unnecessary top padding above the subscription tier heading in `PaymentDialog.tsx`
    - Inspect the `FREQUENCY_SELECT` state wrapper and the outer `<div className="p-6">` content area for excess `pt-*` or `mt-*` classes and remove them
    - _Requirements: 3.2, 3.3_
  - [x] 3.2 Ensure the dialog content is fully responsive down to 320 px
    - Replace any fixed-width classes that could cause horizontal overflow on small screens
    - Verify the `grid-cols-1 md:grid-cols-2` layout in `PaymentFrequencySelector` collapses correctly on mobile
    - Ensure touch targets (buttons) are at least 44 × 44 px on mobile
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 4. Standardise tier naming to MenoBronze / MenoSilver / MenoGold
  - [x] 4.1 Update display strings in `PaymentDialog.tsx`
    - Replace any rendered "Bronze tier", "Silver tier", "Gold tier" strings with "MenoBronze", "MenoSilver", "MenoGold"
    - Update the success-state copy: `"Your ${tier} membership…"` → use `mapTierToConfigTier(tier)` to get the display name
    - Update the upgrade-state heading `"Upgrade to ${tier}"` similarly
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 4.2 Update display strings in `PaymentFrequencySelector.tsx`
    - Replace the `{tier} subscription` interpolation in the subtitle with the mapped Meno-prefixed name
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 4.3 Update display strings in `PaymentBenefitsComparison.tsx`
    - Audit all hardcoded tier label strings and replace with Meno-prefixed equivalents where present
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Show expected checkout amount on the phone-entry screen
  - [x] 5.1 Add a checkout-amount summary line to the `IDLE` (phone-entry) state in `PaymentDialog.tsx`
    - Below the existing "Amount to pay / KES X" block, add a sentence in the format: `"You will be prompted to pay KES X,XXX for MenoSilver (Monthly)"` using `displayAmount`, the Meno-prefixed tier name, and `selectedFrequency`
    - _Requirements: 5.2, 5.3_
  - [x] 5.2 Ensure the displayed amount updates immediately when frequency changes
    - Verify `handleFrequencySelect` already sets `displayAmount`; if not, fix it
    - Confirm the summary line re-renders with the new amount when the user returns to frequency selection and picks a different plan
    - _Requirements: 5.4_
  - [x] 5.3 Add a clear visual selected-state indicator to `PaymentFrequencySelector.tsx`
    - The existing `border-emerald-500` + `Check` icon only appears after click; ensure the selected card also gets a distinct background tint (e.g. `bg-emerald-900/20`) so the active selection is unambiguous at a glance
    - _Requirements: 5.1_

- [x] 6. Improve WaitingPeriodDisplay accessibility (WCAG AA)
  - [x] 6.1 Increase font weights for primary information in `WaitingPeriodDisplay.tsx`
    - Status labels (e.g. "Available Now", "X days remaining") should use `font-semibold` (600) or `font-bold` (700) — verify existing classes and upgrade any that are below 600
    - Section headings and key dates should be `font-semibold` minimum
    - _Requirements: 6.1_
  - [x] 6.2 Fix contrast ratios for text colours in all display states
    - Replace `text-emerald-400` on dark backgrounds where contrast < 4.5:1 with `text-emerald-300` or `text-emerald-200` as needed
    - Replace `text-yellow-400` on `bg-yellow-900/20` where contrast < 4.5:1 with `text-yellow-200`
    - Replace `text-red-400` on `bg-red-900/20` where contrast < 4.5:1 with `text-red-300`
    - Replace `text-gray-400` used for body copy (normal-size text) where contrast < 4.5:1 with `text-gray-300`
    - _Requirements: 6.2, 6.4, 6.5_
  - [x] 6.3 Fix contrast for large-text elements (≥ 18 pt / 24 px or bold ≥ 14 pt / 18.67 px)
    - Verify heading colours (`text-white` on dark backgrounds) already meet 3:1 — no change needed if so
    - Verify progress-bar label text (`text-xs text-gray-400`) meets 3:1 for its size; upgrade to `text-gray-300` if not
    - _Requirements: 6.3_

- [x] 7. Checkpoint — ensure all tests pass
  - Run `jest --testPathPattern="claim-limits|PaymentDialog"` and confirm no regressions
  - Ensure all tests pass; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The design.md is intentionally empty; all design decisions are derived directly from the requirements and existing code
