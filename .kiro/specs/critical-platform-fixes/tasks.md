# Implementation Plan: Critical Platform Fixes

## Overview

This plan addresses four critical production issues through targeted bug fixes and feature implementations. The approach focuses on debugging authentication issues, validating payment configuration, correcting claim limit constants, and implementing separate authentication flows.

## Tasks

- [x] 1. Fix admin payments tab logout bug
  - [x] 1.1 Add comprehensive logging to admin payments component
    - Add logging before and after payment data fetch
    - Log authentication state at each step
    - Log all error conditions with full context
    - _Requirements: 1.1, 1.2, 1.4_
  - [x] 1.2 Review and fix error handling in payment data fetching
    - Identify any code that clears auth tokens on error
    - Remove any logout() calls in error handlers
    - Ensure errors are logged without modifying auth state
    - Add defensive checks to preserve session tokens
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [ ]\* 1.3 Write property test for authentication state preservation
    - **Property 1: Authentication state preservation during payment operations**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
  - [ ]\* 1.4 Write unit test for error logging without logout
    - Test that auth errors are logged without triggering logout
    - **Validates: Requirements 1.4**

- [-] 2. Verify and fix production payment amounts
  - [x] 2.1 Create centralized payment configuration
    - Create payment amount constants for all tiers and frequencies
    - Implement environment-based amount selection
    - Add getPaymentAmount() utility function
    - Add validatePaymentAmount() utility function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  - [x] 2.2 Update checkout flow to use centralized configuration
    - Replace any hardcoded payment amounts
    - Add validation before processing payment
    - Log all payment amount calculations
    - _Requirements: 2.8_
  - [ ]\* 2.3 Write unit tests for payment amounts
    - Test development environment uses KES 5
    - Test each production tier/frequency combination
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**
  - [ ]\* 2.4 Write property test for payment amount validation
    - **Property 3: Payment amount correctness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

- [ ] 3. Checkpoint - Ensure payment fixes are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Fix claim limit display accuracy
  - [x] 4.1 Create centralized claim limit utility
    - Create CLAIM_LIMITS constant with correct values
    - Implement getClaimLimit() utility function
    - Add error handling for invalid tiers
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.2 Update member dashboard to use claim limit utility
    - Replace hardcoded claim limit values
    - Use getClaimLimit(member.tier) for display
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.3 Update staff check-in interface to use claim limit utility
    - Replace hardcoded claim limit values
    - Use getClaimLimit(member.tier) for display
    - _Requirements: 3.4_
  - [x] 4.4 Update admin portal to use claim limit utility
    - Replace hardcoded claim limit values
    - Use getClaimLimit(member.tier) for display
    - _Requirements: 3.5_
  - [x] 4.5 Update report generation to use claim limit utility
    - Replace hardcoded claim limit values in queries
    - Use getClaimLimit(member.tier) for calculations
    - _Requirements: 3.6_
  - [ ]\* 4.6 Write property test for claim limit consistency
    - **Property 5: Claim limit display consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
  - [ ]\* 4.7 Write unit tests for claim limit display
    - Test each tier displays correct limit
    - Test invalid tier handling
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [-] 5. Implement separate signup page
  - [x] 5.1 Create signup page component at /sign-up
    - Create new page route at /sign-up
    - Implement signup form with Full Name, Location, Phone Number fields
    - Add terms and conditions checkbox
    - Add heading "Welcome to MenoDAO"
    - Add label "Please provide the details below to continue"
    - _Requirements: 4.1, 4.2_
  - [x] 5.2 Implement signup form validation
    - Add validation for required fields
    - Add validation for terms checkbox
    - Add phone number format validation
    - Display validation errors to user
    - _Requirements: 4.3, 4.4_
  - [x] 5.3 Implement signup submission flow
    - Send OTP on valid form submission
    - Navigate to OTP verification screen
    - Pass signup data to verification screen
    - _Requirements: 4.5, 4.6_
  - [x] 5.4 Implement signup account creation
    - Create account with provided details on correct OTP
    - Authenticate user after account creation
    - Navigate to dashboard on success
    - _Requirements: 4.7, 4.8_
  - [ ]\* 5.5 Write unit test for signup page rendering
    - Test page displays correct fields and labels
    - **Validates: Requirements 4.1, 4.2**
  - [ ]\* 5.6 Write property test for signup form validation
    - **Property 6: Signup form validation**
    - **Validates: Requirements 4.3, 4.4**
  - [ ]\* 5.7 Write property test for signup account creation
    - **Property 7: Signup account creation**
    - **Validates: Requirements 4.5, 4.7**

- [ ] 6. Update login page for returning users
  - [x] 6.1 Update login page component at /login
    - Simplify to phone number entry only
    - Remove any signup-related fields
    - Update UI labels for returning users
    - _Requirements: 5.1_
  - [x] 6.2 Implement phone number existence check
    - Check if phone number exists before sending OTP
    - Display error "Phone number not found. Please sign up instead"
    - Show visible "Sign Up" button linking to /sign-up
    - _Requirements: 5.2, 5.3_
  - [x] 6.3 Implement login OTP flow
    - Send OTP only for existing phone numbers
    - Navigate to OTP verification screen
    - _Requirements: 5.4, 5.5_
  - [x] 6.4 Implement login authentication
    - Authenticate user on correct OTP
    - Navigate to dashboard on success
    - Display error and allow retry on incorrect OTP
    - _Requirements: 5.6, 5.7_
  - [ ]\* 6.5 Write unit test for login page rendering
    - Test page displays phone number field
    - **Validates: Requirements 5.1**
  - [ ]\* 6.6 Write property test for non-existent phone handling
    - **Property 8: Non-existent phone number handling**
    - **Validates: Requirements 5.2**
  - [ ]\* 6.7 Write property test for existing phone OTP sending
    - **Property 9: Existing phone number OTP sending**
    - **Validates: Requirements 5.4**
  - [ ]\* 6.8 Write property test for login authentication
    - **Property 10: Login authentication**
    - **Validates: Requirements 5.6**
  - [ ]\* 6.9 Write property test for incorrect OTP handling
    - **Property 11: Incorrect OTP handling**
    - **Validates: Requirements 5.7**

- [ ] 7. Update shared OTP verification component
  - [x] 7.1 Enhance OTP verification to handle both flows
    - Accept flow type parameter ('signup' or 'login')
    - Accept optional signup data for signup flow
    - Handle account creation for signup flow
    - Handle authentication for both flows
    - _Requirements: 4.6, 4.7, 4.8, 5.5, 5.6, 5.7_
  - [ ]\* 7.2 Write unit tests for OTP verification flows
    - Test signup flow creates account
    - Test login flow authenticates existing user
    - Test incorrect OTP displays error
    - **Validates: Requirements 4.7, 5.6, 5.7**

- [ ] 8. Final checkpoint - Ensure all fixes are working
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on debugging admin logout issue first as it's blocking admin operations
- Payment amount verification is critical for production correctness
- Claim limit fixes improve user trust and accuracy
- Separate auth flows improve user experience and reduce confusion
