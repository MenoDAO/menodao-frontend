# Subscription Payment Fixes - Requirements

## Overview

Fix critical bugs in the subscription and payment flow that are blocking production launch.

## Problem Statement

1. Upgrade endpoint is being called when a member subscribes for the first time, causing 400 errors after successful payment
2. No subscription SMS is sent after payment completion
3. Upgrade cost shows monthly difference even when user selected and paid for yearly plan

## User Stories

### 1. First-Time Subscription Flow

**As a** new member  
**I want to** subscribe to a tier for the first time  
**So that** I can activate my membership without errors

**Acceptance Criteria:**

- 1.1 When I select a tier and have no active subscription, the upgrade endpoint should NOT be called
- 1.2 The payment dialog should open directly without checking upgrade eligibility
- 1.3 After successful payment, I should see the success animation without any 400 errors
- 1.4 My subscription should be activated correctly in the database

### 2. Subscription SMS Notifications

**As a** member who just paid for a subscription  
**I want to** receive an SMS confirmation  
**So that** I know my payment was successful and my subscription is active

**Acceptance Criteria:**

- 2.1 After successful payment for a new subscription, I receive a welcome SMS
- 2.2 The SMS includes my tier name (MenoBronze, MenoSilver, or MenoGold)
- 2.3 The SMS includes the waiting period information (14 days for annual, 60 days for monthly)
- 2.4 The SMS includes the date when I can start making claims
- 2.5 SMS failures should not block the payment completion process

### 3. Upgrade Cost Calculation

**As a** member with an annual subscription  
**I want to** see the correct upgrade cost based on my payment frequency  
**So that** I pay the right amount when upgrading

**Acceptance Criteria:**

- 3.1 When I have an annual subscription and try to upgrade, the cost shown should be the annual price difference
- 3.2 When I have a monthly subscription and try to upgrade, the cost shown should be the monthly price difference
- 3.3 The upgrade cost calculation should respect the `paymentFrequency` field from my subscription
- 3.4 The backend upgrade endpoint should correctly calculate costs based on stored payment frequency

## Technical Requirements

### 4. Frontend Logic Fix

**Requirement:** Fix the subscription page logic to distinguish between first subscription and upgrade

**Acceptance Criteria:**

- 4.1 The `handleSubscribe` function should only call `api.upgrade()` when the user has an ACTIVE subscription AND is selecting a higher tier
- 4.2 For inactive subscriptions or no subscription, it should directly open the payment dialog
- 4.3 The `isUpgrade` prop should only be true when upgrading an active subscription

### 5. Payment Frequency Persistence

**Requirement:** Ensure payment frequency is correctly saved and used throughout the system

**Acceptance Criteria:**

- 5.1 When a subscription is created, the `paymentFrequency` field must be saved to the database
- 5.2 The upgrade endpoint must read the `paymentFrequency` from the existing subscription
- 5.3 The upgrade cost calculation must use the correct frequency (monthly vs annual)

### 6. SMS Integration

**Requirement:** Send SMS notifications after successful subscription payments

**Acceptance Criteria:**

- 6.1 The payment service should send SMS after activating a new subscription
- 6.2 The SMS should be sent to the member's registered phone number
- 6.3 SMS failures should be logged but not block payment completion
- 6.4 The SMS message should be clear and informative

## Out of Scope

- Changing the payment amounts or pricing structure
- Modifying the upgrade eligibility rules
- Adding new subscription tiers
- Changing the waiting period durations

## Success Metrics

- Zero 400 errors after successful first-time subscription payments
- 100% of new subscribers receive SMS confirmation
- Upgrade costs correctly reflect annual vs monthly pricing
- No user complaints about incorrect upgrade pricing

## Dependencies

- Backend: subscriptions.service.ts, payment.service.ts
- Frontend: subscription/page.tsx, PaymentDialog.tsx
- SMS service must be configured and working

## Risks

- SMS service failures could prevent notifications (mitigated by non-blocking error handling)
- Existing subscriptions in database may have incorrect `paymentFrequency` values (needs data migration)
