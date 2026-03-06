# Design Document

## Overview

This design addresses critical payment flow bugs and UX improvements in the MenoDAO subscription system. The primary issue is that claim limits are being activated when a user selects a subscription package, before payment confirmation. This creates a security vulnerability where users could access benefits without paying. Additionally, several UX improvements will enhance clarity, consistency, and usability throughout the payment flow.

## Architecture

### Current Payment Flow

1. User selects subscription tier (Bronze/Silver/Gold)
2. User selects payment frequency (Monthly/Annual)
3. **PROBLEM**: Subscription is created with `isActive: false` but claim limits may be referenced
4. User enters phone number
5. STK push is initiated
6. Payment callback is received
7. Subscription is activated via `activateSubscription()`

### Proposed Payment Flow

1. User selects subscription tier
2. User selects payment frequency
3. Subscription is created with `isActive: false` and NO claim limit access
4. User sees expected checkout amount clearly displayed
5. User enters phone number
6. STK push is initiated
7. Payment callback is received
8. **ONLY AFTER CONFIRMATION**: Subscription is activated AND claim limits become accessible

## Components and Interfaces

### Backend Components

#### SubscriptionsService

- **Location**: `menodao-backend/src/subscriptions/subscriptions.service.ts`
- **Modifications**:
  - Ensure `subscribe()` method creates inactive subscriptions
  - Ensure `activateSubscription()` is the ONLY method that enables claim limit access
  - Add validation to prevent claim limit queries for inactive subscriptions

#### PaymentService

- **Location**: `menodao-backend/src/payments/payment.service.ts`
- **Modifications**:
  - Ensure `assignClaimLimits()` is only called after payment confirmation
  - Add logging to track when claim limits are assigned
  - Remove any premature claim limit assignment

#### VisitsService

- **Location**: `menodao-backend/src/visits/visits.service.ts`
- **Modifications**:
  - Add validation to check subscription `isActive` status before returning claim limits
  - Return error or zero claim limit for inactive subscriptions

### Frontend Components

#### claim-limits.ts

- **Location**: `menodao-frontend/src/lib/claim-limits.ts`
- **Modifications**:
  - Remove all `console.log` statements
  - Update tier names to use "Meno" prefix consistently
  - Add validation to check subscription active status

#### payment-config.ts

- **Location**: `menodao-frontend/src/lib/payment-config.ts`
- **Modifications**:
  - Remove all `console.log` statements
  - Ensure tier names use "Meno" prefix

#### PaymentFrequencySelector.tsx

- **Location**: `menodao-frontend/src/app/payment/components/PaymentFrequencySelector.tsx`
- **Modifications**:
  - Remove excessive top padding in dialog
  - Improve visual indication of selected payment frequency
  - Add explicit confirmation text for selected option
  - Remove `console.log` statements

#### Phone Number Entry Screen (New/Modified)

- **Location**: TBD (likely in payment flow)
- **Modifications**:
  - Display expected checkout amount prominently
  - Show tier name with "Meno" prefix
  - Show payment frequency (monthly/yearly)
  - Format amount in KES with proper formatting

#### WaitingPeriodDisplay.tsx

- **Location**: `menodao-frontend/src/app/dashboard/components/WaitingPeriodDisplay.tsx`
- **Modifications**:
  - Improve text contrast for waiting period information
  - Use bold font weight for labels and values
  - Ensure WCAG AA contrast compliance
  - Test on both light and dark backgrounds

### Admin Panel Components

- **Location**: Various admin components
- **Modifications**:
  - Remove all `console.log` statements from dashboard
  - Remove unnecessary debug logging

## Data Models

### Subscription Model

```typescript
interface Subscription {
  id: string;
  memberId: string;
  tier: PackageTier;
  isActive: boolean; // CRITICAL: Must be false until payment confirmed
  annualCapLimit: number;
  annualCapUsed: number;
  paymentFrequency: "MONTHLY" | "ANNUAL";
  subscriptionStartDate: Date;
  // ... other fields
}
```

### Contribution Model

```typescript
interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  claimLimitsAssigned: boolean; // Track if limits were assigned
  claimLimitsAssignedAt?: Date;
  // ... other fields
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Property 1: Claim limits unchanged during payment flow
_For any_ user navigating through the payment flow (selecting tier, selecting frequency, entering phone number, initiating payment), the claim limit should remain unchanged at every step until payment confirmation is received.
**Validates: Requirements 1.1, 1.2**

Property 2: Claim limits updated after successful payment
_For any_ successful payment confirmation, the system should update the user's claim limit to match the purchased subscription tier's expected limit.
**Validates: Requirements 1.3**

Property 3: Claim limits preserved on payment failure
_For any_ failed or cancelled payment, the user's existing claim limit should remain unchanged.
**Validates: Requirements 1.4**

Property 4: Only confirmed payments affect claim limits
_For any_ claim limit query, only payments with COMPLETED status should be included in the calculation.
**Validates: Requirements 1.5**

Property 5: Tier names include Meno prefix
_For any_ tier name display throughout the application (UI components, API responses, database displays), the tier name should be prefixed with "Meno" (e.g., "MenoBronze", "MenoSilver", "MenoGold").
**Validates: Requirements 4.1, 4.6**

Property 6: Selected payment frequency is visually highlighted
_For any_ payment frequency selection (monthly or yearly), the selected option should have visual highlighting applied (CSS classes or styles indicating selection).
**Validates: Requirements 5.1, 5.2**

Property 7: Payment frequency confirmation displayed
_For any_ payment frequency selection, confirmation text indicating the chosen frequency should be displayed to the user.
**Validates: Requirements 5.3**

Property 8: Selection state persists through flow
_For any_ payment flow navigation, the selected payment frequency should maintain its visual indication throughout all steps until completion.
**Validates: Requirements 5.4**

Property 9: Payment summary includes frequency
_For any_ payment summary display, the selected payment frequency should be explicitly stated in the summary text.
**Validates: Requirements 5.5**

Property 10: Complete payment information displayed
_For any_ phone number entry screen display, the system should show the expected checkout amount in KES format, the subscription tier name with "Meno" prefix, and the payment frequency (monthly/yearly).
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Property 11: Displayed amount matches selection
_For any_ tier and payment frequency combination, the displayed checkout amount should match the expected amount calculated from the payment configuration for that tier and frequency.
**Validates: Requirements 6.5**

Property 12: Consistent waiting period styling
_For any_ display showing multiple waiting periods, all waiting period elements should have consistent text styling (same CSS classes, font weights, colors).
**Validates: Requirements 7.5**

## Error Handling

### Claim Limit Access Errors

- **Scenario**: User attempts to access claim limits with inactive subscription
- **Response**: Return error message "Subscription not active" or zero claim limit
- **Logging**: Log attempt with user ID and subscription status

### Payment Confirmation Errors

- **Scenario**: Payment callback received but subscription not found
- **Response**: Log error and return failure response to payment provider
- **Logging**: Log full callback data for debugging

### Invalid Tier Name Errors

- **Scenario**: Tier name requested without "Meno" prefix in legacy code
- **Response**: Normalize tier name to include prefix or throw validation error
- **Logging**: Log legacy tier name usage for migration tracking

### Amount Mismatch Errors

- **Scenario**: Displayed amount doesn't match calculated amount
- **Response**: Show error to user and prevent payment initiation
- **Logging**: Log mismatch details with tier, frequency, expected, and actual amounts

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** will focus on:

- Specific examples of claim limit checks with inactive subscriptions
- Edge cases like payment callbacks with missing data
- Integration between payment service and subscription service
- Specific tier name formatting examples (Bronze → MenoBronze)
- CSS class application for selected payment frequencies
- Specific amount calculations for each tier/frequency combination

**Property-Based Tests** will focus on:

- Universal properties that hold for all payment flows (Properties 1-4)
- Tier name formatting across all tiers and display contexts (Property 5)
- Payment frequency selection behavior for all frequencies (Properties 6-9)
- Amount display correctness for all tier/frequency combinations (Properties 10-11)
- Styling consistency across all waiting period displays (Property 12)

### Property-Based Testing Configuration

- **Library**: fast-check (for TypeScript/JavaScript)
- **Minimum iterations**: 100 per property test
- **Test tagging**: Each property test must include a comment referencing its design property
  - Format: `// Feature: payment-ux-improvements, Property {number}: {property_text}`

### Test Coverage Requirements

1. **Backend Tests**:
   - Subscription service: Test that `subscribe()` creates inactive subscriptions
   - Subscription service: Test that `activateSubscription()` is required for claim limit access
   - Payment service: Test that `assignClaimLimits()` only runs after confirmation
   - Visits service: Test claim limit queries reject inactive subscriptions

2. **Frontend Tests**:
   - Test claim-limits.ts functions with inactive subscription status
   - Test PaymentFrequencySelector visual state changes
   - Test phone entry screen displays complete payment information
   - Test tier name formatting in all components

3. **Integration Tests**:
   - Full payment flow from selection to confirmation
   - Failed payment flow preserves claim limits
   - Cancelled payment flow preserves claim limits

### Manual Testing Checklist

- [ ] Verify console is clean in production build
- [ ] Verify payment dialog spacing on mobile devices
- [ ] Verify payment dialog spacing on desktop devices
- [ ] Verify waiting period text contrast meets WCAG AA standards
- [ ] Verify waiting period text is readable on light backgrounds
- [ ] Verify waiting period text is readable on dark backgrounds

## Implementation Notes

### Critical Security Fix

The most critical fix is ensuring claim limits are ONLY accessible after payment confirmation. This requires:

1. **Backend validation**: Add checks in all claim limit query methods to verify `subscription.isActive === true`
2. **Frontend validation**: Check subscription status before displaying claim limit information
3. **Payment flow**: Ensure `activateSubscription()` is called ONLY in payment callback after successful confirmation

### Console.log Removal Strategy

1. Search for all `console.log` statements in:
   - `menodao-frontend/src/lib/claim-limits.ts`
   - `menodao-frontend/src/lib/payment-config.ts`
   - `menodao-frontend/src/app/payment/components/`
   - `menodao-frontend/src/app/admin/components/`
   - `menodao-backend/src/payments/`
   - `menodao-backend/src/subscriptions/`

2. Replace with proper logging where needed:
   - Backend: Use NestJS Logger
   - Frontend: Use structured logging library or remove entirely

### Tier Name Migration

1. Update all hardcoded tier names to include "Meno" prefix
2. Update database queries to handle both formats during transition
3. Update API responses to use new format
4. Update frontend displays to use new format

### UI/UX Improvements

1. **Payment dialog**: Adjust CSS padding/margin for better spacing
2. **Payment frequency selector**: Add clear visual indicators (checkmarks, borders, background colors)
3. **Phone entry screen**: Add prominent amount display component
4. **Waiting period display**: Increase font weight and improve color contrast

## Migration Considerations

### Backward Compatibility

- Tier name changes should support both old and new formats during transition
- Database records may contain old tier names (BRONZE, SILVER, GOLD)
- API should accept both formats but return new format

### Data Migration

No database migration required - this is primarily a code and UI change. However:

- Existing subscriptions will continue to work
- New subscriptions will use updated flow
- Claim limits for existing active subscriptions are unaffected

### Rollback Plan

If issues arise:

1. Revert claim limit validation changes
2. Revert tier name changes (use old format)
3. Revert UI changes
4. Monitor for any users affected by premature claim limit activation
