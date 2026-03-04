# Implementation Plan: Payment UX Improvements

## Overview

This implementation plan addresses a critical security bug where claim limits are activated prematurely before payment confirmation, along with several UX improvements for better clarity and consistency. The work is organized into backend security fixes, frontend UX improvements, and comprehensive testing.

## Tasks

- [ ] 1. Fix critical claim limit activation bug in backend
  - [ ] 1.1 Add subscription active status validation to VisitsService
    - Modify `getRemainingClaimLimit()` to check `subscription.isActive`
    - Return zero or error for inactive subscriptions
    - _Requirements: 1.1, 1.2, 1.5_
  - [ ] 1.2 Ensure SubscriptionsService only activates after payment
    - Verify `subscribe()` creates subscriptions with `isActive: false`
    - Verify `activateSubscription()` is only called from payment callback
    - Add logging to track activation events
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 1.3 Update PaymentService claim limit assignment
    - Ensure `assignClaimLimits()` only runs after payment confirmation
    - Add validation to check payment status before assignment
    - Add logging for claim limit assignment events
    - _Requirements: 1.3, 1.4_
  - [ ]\* 1.4 Write property test for claim limit protection during payment flow
    - **Property 1: Claim limits unchanged during payment flow**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]\* 1.5 Write property test for claim limit update after payment
    - **Property 2: Claim limits updated after successful payment**
    - **Validates: Requirements 1.3**
  - [ ]\* 1.6 Write property test for claim limit preservation on failure
    - **Property 3: Claim limits preserved on payment failure**
    - **Validates: Requirements 1.4**
  - [ ]\* 1.7 Write property test for confirmed payments only
    - **Property 4: Only confirmed payments affect claim limits**
    - **Validates: Requirements 1.5**

- [x] 2. Remove console.log statements from codebase
  - [x] 2.1 Remove console.log from claim-limits.ts
    - Remove all console.log statements
    - Replace with proper error handling where needed
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Remove console.log from payment-config.ts
    - Remove all console.log statements
    - Replace with proper error handling where needed
    - _Requirements: 2.1, 2.2_
  - [x] 2.3 Remove console.log from PaymentFrequencySelector.tsx
    - Remove all console.log statements
    - _Requirements: 2.1, 2.2_
  - [x] 2.4 Remove console.log from admin panel components
    - Search and remove console.log from all admin components
    - _Requirements: 2.1_
  - [x] 2.5 Remove console.log from backend payment services
    - Replace console.log with NestJS Logger in SubscriptionsService
    - Replace console.log with NestJS Logger in PaymentService
    - _Requirements: 2.3, 2.4_

- [ ] 3. Standardize tier naming with "Meno" prefix
  - [ ] 3.1 Update claim-limits.ts tier type definitions
    - Update SubscriptionTier type to use "MenoBronze", "MenoSilver", "MenoGold"
    - Update CLAIM_LIMITS object keys
    - Update all function implementations
    - _Requirements: 4.1, 4.6_
  - [ ] 3.2 Update payment-config.ts tier definitions
    - Ensure SubscriptionTier type uses "Meno" prefix
    - Update PAYMENT_CONFIG tier keys
    - _Requirements: 4.1, 4.6_
  - [ ] 3.3 Update backend SubscriptionsService tier displays
    - Update getPackages() to return tier names with "Meno" prefix
    - Update PACKAGE_BENEFITS keys to use "Meno" prefix
    - _Requirements: 4.1, 4.6_
  - [ ]\* 3.4 Write property test for tier name formatting
    - **Property 5: Tier names include Meno prefix**
    - **Validates: Requirements 4.1, 4.6**

- [ ] 4. Improve payment frequency selection clarity
  - [ ] 4.1 Enhance visual highlighting in PaymentFrequencySelector
    - Add stronger border color for selected option
    - Add background color change for selected option
    - Add checkmark icon for selected option (already present, ensure visible)
    - _Requirements: 5.1, 5.2_
  - [ ] 4.2 Add explicit confirmation text for selected frequency
    - Display "You selected: Monthly Plan" or "You selected: Annual Plan"
    - Show text below the selection cards
    - _Requirements: 5.3_
  - [ ] 4.3 Persist selection state through payment flow
    - Ensure selectedFrequency state is maintained
    - Pass selection to next screen via props or state management
    - _Requirements: 5.4_
  - [ ]\* 4.4 Write property test for frequency selection highlighting
    - **Property 6: Selected payment frequency is visually highlighted**
    - **Validates: Requirements 5.1, 5.2**
  - [ ]\* 4.5 Write property test for frequency confirmation display
    - **Property 7: Payment frequency confirmation displayed**
    - **Validates: Requirements 5.3**
  - [ ]\* 4.6 Write property test for selection state persistence
    - **Property 8: Selection state persists through flow**
    - **Validates: Requirements 5.4**

- [ ] 5. Add expected checkout amount display to phone entry screen
  - [ ] 5.1 Create or modify phone number entry component
    - Identify the phone number entry screen component
    - Add amount display section above phone input
    - _Requirements: 6.1_
  - [ ] 5.2 Implement payment information display component
    - Display tier name with "Meno" prefix
    - Display payment frequency (Monthly/Yearly)
    - Display amount in KES format with proper formatting
    - Use prominent styling (large font, bold)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ] 5.3 Calculate and validate displayed amount
    - Get amount from payment-config based on tier and frequency
    - Validate amount matches expected calculation
    - _Requirements: 6.5_
  - [ ]\* 5.4 Write property test for complete payment information display
    - **Property 10: Complete payment information displayed**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - [ ]\* 5.5 Write property test for amount accuracy
    - **Property 11: Displayed amount matches selection**
    - **Validates: Requirements 6.5**

- [x] 6. Improve waiting period text legibility
  - [x] 6.1 Update WaitingPeriodDisplay.tsx text styling
    - Increase font weight for waiting period labels (use font-semibold or font-bold)
    - Increase font weight for waiting period values
    - _Requirements: 7.2_
  - [x] 6.2 Improve text color contrast
    - Review current text colors against backgrounds
    - Update colors to meet WCAG AA standards (4.5:1 for normal text)
    - Test on both light and dark backgrounds
    - _Requirements: 7.1, 7.3, 7.4_
  - [ ]\* 6.3 Write property test for consistent styling
    - **Property 12: Consistent waiting period styling**
    - **Validates: Requirements 7.5**

- [x] 7. Fix payment plan dialog responsiveness
  - [x] 7.1 Adjust dialog padding in PaymentFrequencySelector
    - Remove excessive top padding above tier text
    - Adjust spacing for better mobile and desktop display
    - Test on various screen sizes
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8. Integration testing and validation
  - [ ]\* 8.1 Write integration test for full payment flow
    - Test complete flow: select tier → select frequency → enter phone → payment → activation
    - Verify claim limits only accessible after confirmation
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]\* 8.2 Write integration test for failed payment flow
    - Test flow with payment failure
    - Verify claim limits unchanged
    - _Requirements: 1.4_
  - [ ]\* 8.3 Write unit tests for tier name formatting
    - Test specific examples: Bronze → MenoBronze, Silver → MenoSilver, Gold → MenoGold
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The critical security fix (Task 1) should be prioritized
- Console.log removal (Task 2) improves production code quality
- UX improvements (Tasks 3-7) enhance user experience and clarity
