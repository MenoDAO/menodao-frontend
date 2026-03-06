# Implementation Plan: Improved Authentication Flow

## Overview

This implementation plan breaks down the improved authentication flow into discrete coding tasks. The approach follows a backend-first strategy, implementing the user status detection and authentication services before building the frontend components. Each task builds incrementally, with testing integrated throughout to catch errors early.

## Tasks

- [ ] 1. Set up backend authentication infrastructure
  - [ ] 1.1 Add termsAcceptedAt field to User model in Prisma schema
    - Update the User model to include `termsAcceptedAt DateTime` field
    - Generate and run Prisma migration
    - _Requirements: 5.3, 5.4_
  - [ ] 1.2 Create user status service
    - Implement `UserStatusService` with `checkUserExists()` method
    - Query database by phone number and return existence status
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]\* 1.3 Write property test for user status detection
    - **Property 1: User Status Detection Accuracy**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [ ] 1.4 Create OTP session management
    - Implement `OTPService` with session storage (in-memory or Redis)
    - Add methods: `generateAndSendOTP()`, `verifyOTP()`, `getSession()`, `invalidateSession()`
    - Implement 10-minute expiration logic
    - _Requirements: 4.2, 4.3, 4.5_
  - [ ]\* 1.5 Write property test for OTP validation logic
    - **Property 5: OTP Validation Logic**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [ ] 2. Implement authentication controller endpoints
  - [ ] 2.1 Create check-status endpoint
    - Implement `POST /auth/check-status` endpoint
    - Accept phone number, return user existence status
    - Add error handling for database failures
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ] 2.2 Create signup endpoint
    - Implement `POST /auth/signup` endpoint
    - Accept signup data (phone, name, location, termsAccepted)
    - Validate required fields and terms acceptance
    - Generate and send OTP, return sessionId
    - _Requirements: 2.4, 2.5, 2.6_
  - [ ] 2.3 Create login endpoint
    - Implement `POST /auth/login` endpoint
    - Accept phone number only
    - Verify user exists, generate and send OTP
    - _Requirements: 3.4_
  - [ ] 2.4 Create verify-otp endpoint
    - Implement `POST /auth/verify-otp` endpoint
    - Verify OTP against session
    - For signup: create user with profile data and termsAcceptedAt timestamp
    - For login: authenticate existing user without profile collection
    - Return JWT token and user profile
    - _Requirements: 2.8, 3.6, 4.2, 4.3, 5.3, 5.4_
  - [ ]\* 2.5 Write property test for OTP generation
    - **Property 3: OTP Generation and Delivery**
    - **Validates: Requirements 2.6, 3.4**
  - [ ]\* 2.6 Write property test for user creation
    - **Property 4: User Creation with Complete Data**
    - **Validates: Requirements 2.8, 5.3, 5.4, 5.5**
  - [ ]\* 2.7 Write property test for login without profile collection
    - **Property 6: Login Without Profile Collection**
    - **Validates: Requirements 3.6**
  - [ ]\* 2.8 Write unit tests for error scenarios
    - Test database failure handling
    - Test OTP sending failure
    - Test invalid/expired OTP handling
    - _Requirements: 1.5, 4.4, 7.2, 7.3_

- [ ] 3. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement frontend authentication components
  - [ ] 4.1 Create PhoneInputScreen component
    - Build phone number input form
    - Add phone format validation
    - Call check-status API on submission
    - Handle loading and error states
    - _Requirements: 7.1_
  - [ ]\* 4.2 Write property test for phone validation
    - **Property 7: Phone Number Format Validation**
    - **Validates: Requirements 7.1**
  - [ ] 4.3 Create SignupForm component
    - Build form with fields: fullName, location, phoneNumber
    - Add terms and conditions checkbox with link/text
    - Implement form validation (all fields required, terms must be accepted)
    - Enable/disable submit button based on validation
    - Display "Join MenoDAO" heading
    - Call signup API on submission
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2_
  - [ ]\* 4.4 Write property test for signup form validation
    - **Property 2: Signup Form Validation State**
    - **Validates: Requirements 2.4, 2.5**
  - [ ]\* 4.5 Write unit tests for SignupForm
    - Test form renders with all required fields
    - Test terms checkbox prevents submission
    - Test validation error display
    - _Requirements: 2.2, 2.3, 5.1, 5.2_
  - [ ] 4.6 Create LoginForm component
    - Build form with only phone number field
    - Display "Welcome Back" heading
    - Call login API on submission
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]\* 4.7 Write unit tests for LoginForm
    - Test form renders with only phone field
    - Test no name/location/terms fields present
    - _Requirements: 3.2, 3.3_

- [ ] 5. Implement OTP verification and flow orchestration
  - [ ] 5.1 Create OTPVerificationScreen component
    - Build OTP input field
    - Call verify-otp API on submission
    - Handle success (navigate to dashboard) and error states
    - Display error messages with retry option
    - _Requirements: 4.1, 4.6_
  - [ ]\* 5.2 Write unit tests for OTPVerificationScreen
    - Test OTP input field renders
    - Test error message display
    - Test retry functionality
    - _Requirements: 4.1, 4.6_
  - [ ] 5.3 Create AuthFlowOrchestrator component
    - Implement state machine for auth flow steps
    - Route between: phone-input → signup/login → otp-verification → complete
    - Pass data between steps (phone number, sessionId, signup data)
    - Handle navigation based on user status
    - _Requirements: 2.7, 3.5_
  - [ ]\* 5.4 Write integration tests for complete flows
    - Test new user signup flow end-to-end
    - Test returning user login flow end-to-end
    - Test error recovery flows
    - _Requirements: 2.1-2.8, 3.1-3.6_

- [ ] 6. Implement error handling and logging
  - [ ] 6.1 Add error logging to authentication services
    - Log all authentication errors with context
    - Include correlation IDs for tracing
    - Mask sensitive data (phone numbers, OTPs)
    - _Requirements: 7.5_
  - [ ]\* 6.2 Write property test for error logging
    - **Property 8: Authentication Error Logging**
    - **Validates: Requirements 7.5**
  - [ ] 6.3 Add frontend error handling
    - Display user-friendly error messages
    - Implement retry logic with exponential backoff
    - Maintain form state on errors
    - _Requirements: 7.4_
  - [ ]\* 6.4 Write unit tests for error handling
    - Test network error display
    - Test retry button functionality
    - Test form state preservation
    - _Requirements: 7.4_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Backend implementation comes first to enable frontend integration
- Property tests validate universal correctness across all inputs
- Unit tests validate specific UI behaviors and error scenarios
- Checkpoints ensure incremental validation at key milestones
