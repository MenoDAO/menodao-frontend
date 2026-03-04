# Requirements Document

## Introduction

This specification addresses critical enhancements to the MenoDAO platform's payment, subscription, and administrative systems. The current implementation has several gaps: users report subscription activation issues after successful payments, claim limits are not properly enforced according to tier specifications, waiting periods for monthly vs yearly payments are not differentiated, clinic disbursals lack proper tracking and verification, and administrators lack comprehensive tools for payment and member management.

This enhancement implements six major feature areas: an admin panel for payment and member management, a robust clinic disbursal system with multiple payment channels, payment callback and redirect URL verification, subscription tier claim limit enforcement, differentiated waiting periods for monthly vs yearly payments, and a yearly payment option in the frontend.

## Glossary

- **Admin_Panel**: Web interface for administrators to manage payments, members, and system operations
- **Payment_Service**: Backend service responsible for processing payments and managing payment lifecycle
- **Disbursal_Service**: Backend service responsible for sending payments to clinics
- **SasaPay_API**: Third-party payment provider API for C2B (customer-to-business) and B2C (business-to-customer) transactions
- **M-Pesa**: Mobile money service used for payments in Kenya
- **Buy_Goods**: M-Pesa payment method using a Till Number
- **Paybill**: M-Pesa payment method using a Business Number
- **Claim_Limit**: Maximum monetary amount a member can claim per year based on subscription tier
- **Subscription_Tier**: Membership level (Bronze, Silver, Gold) with different benefits and claim limits
- **Waiting_Period**: Time duration after subscription activation before certain procedures are covered
- **Payment_Frequency**: Whether subscription is paid monthly or yearly (annual)
- **Callback_URL**: URL that SasaPay calls to notify payment status changes
- **Redirect_URL**: URL where users are redirected after payment completion
- **Ghost_Claim**: Scenario where a user has active claim limits despite payment not being confirmed
- **Disbursal_Status**: Current state of a clinic payment (pending, completed, failed, reversed)
- **Manual_Bank_Payment**: Direct bank transfer to clinic account via SasaPay B2C API

## Requirements

### Requirement 1: Admin Panel - Payment Information Display

**User Story:** As an administrator, I want to view complete payment information for any transaction, so that I can investigate payment issues and verify transaction status.

#### Acceptance Criteria

1. WHEN an administrator searches for a payment by transaction ID, THE Admin_Panel SHALL display the complete payment record
2. THE Admin_Panel SHALL display these payment fields: transaction ID, user ID, amount, status, subscription type, payment frequency, created timestamp, updated timestamp, confirmed timestamp
3. THE Admin_Panel SHALL display the payment status history with all status transitions and timestamps
4. WHEN a payment has associated claim limits, THE Admin_Panel SHALL display whether claim limits were assigned and when
5. THE Admin_Panel SHALL provide a search interface that accepts transaction ID, user phone number, or user email
6. WHEN displaying payment information, THE Admin_Panel SHALL include links to related records (user profile, subscription, claims)
7. THE Admin_Panel SHALL display SasaPay-specific fields: MerchantRequestID, CheckoutRequestID, MpesaReceiptNumber

### Requirement 2: Admin Panel - Member Information Display

**User Story:** As an administrator, I want to view complete member information including subscription and payment history, so that I can assist members with account issues while respecting their privacy.

#### Acceptance Criteria

1. WHEN an administrator searches for a member by phone number or email, THE Admin_Panel SHALL display the member profile
2. THE Admin_Panel SHALL display these member fields: full name, phone number, email, location, registration date, account status
3. THE Admin_Panel SHALL display current subscription information: tier, status, start date, payment frequency, claim limits
4. THE Admin_Panel SHALL display payment history with transaction IDs, amounts, dates, and statuses
5. THE Admin_Panel SHALL display claim summary: total claims, total amount claimed, remaining claim limit
6. THE Admin_Panel SHALL NOT display actual treatment details or medical information
7. THE Admin_Panel SHALL display waiting period status: days remaining for consultations/extractions and restorative procedures

### Requirement 3: Admin Panel - Member Management Actions

**User Story:** As an administrator, I want to perform management actions on member accounts, so that I can handle exceptional situations and resolve issues.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Suspend Member" action that sets the member account status to suspended
2. WHEN a member is suspended, THE Payment_Service SHALL prevent new payments and claim submissions
3. THE Admin_Panel SHALL provide a "Deactivate Subscription" action that sets the subscription status to inactive
4. WHEN a subscription is deactivated, THE Payment_Service SHALL revoke claim limits and prevent new claims
5. THE Admin_Panel SHALL provide a "Verify Payment Manually" action that queries SasaPay and updates payment status
6. WHEN manual payment verification succeeds and payment is confirmed, THE Payment_Service SHALL assign claim limits if not already assigned
7. THE Admin_Panel SHALL require confirmation dialogs for all destructive actions
8. THE Admin_Panel SHALL log all administrative actions with administrator ID, action type, target member/payment, and timestamp

### Requirement 4: Admin Panel - Disbursal Management

**User Story:** As an administrator, I want to manage clinic disbursals including reversals and retries, so that I can handle failed payments and correct errors.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Reverse Disbursal" action for completed disbursals
2. WHEN a disbursal is reversed, THE Disbursal_Service SHALL mark the disbursal status as reversed and update the claim status
3. THE Admin_Panel SHALL provide a "Retry Disbursal" action for failed disbursals
4. WHEN a disbursal is retried, THE Disbursal_Service SHALL attempt the payment again using the same payment details
5. THE Admin_Panel SHALL display disbursal status for each claim: pending, processing, completed, failed, reversed
6. THE Admin_Panel SHALL display disbursal details: amount, recipient phone/account, transaction reference, timestamp, error message (if failed)
7. THE Admin_Panel SHALL require administrator confirmation before reversing or retrying disbursals

### Requirement 5: Clinic Disbursal - M-Pesa Payment Channels

**User Story:** As a system, I want to support multiple M-Pesa payment channels for clinic disbursals, so that clinics can receive payments through their preferred method.

#### Acceptance Criteria

1. THE Disbursal_Service SHALL support M-Pesa Buy Goods (Till Number) as a payment channel
2. THE Disbursal_Service SHALL support M-Pesa Paybill (Business Number) as a payment channel
3. THE Disbursal_Service SHALL support M-Pesa Mobile Number as a payment channel
4. WHEN a clinic has a configured payment channel, THE Disbursal_Service SHALL use that channel for all disbursals to that clinic
5. THE Disbursal_Service SHALL store the payment channel type with each disbursal record
6. WHEN initiating a disbursal, THE Disbursal_Service SHALL validate that the clinic has a configured payment channel
7. WHEN a clinic payment channel is not configured, THE Disbursal_Service SHALL fail the disbursal with a descriptive error

### Requirement 6: Clinic Disbursal - Manual Bank Payments

**User Story:** As a system, I want to support manual bank payments to clinics via SasaPay B2C API, so that clinics without M-Pesa can receive payments directly to their bank accounts.

#### Acceptance Criteria

1. THE Disbursal_Service SHALL support bank account transfers as a payment channel
2. WHEN a clinic has a bank account configured, THE Disbursal_Service SHALL use SasaPay B2C API for bank transfers
3. THE Disbursal_Service SHALL store bank account details: account number, bank name, branch code
4. WHEN initiating a bank transfer, THE Disbursal_Service SHALL include the bank account details in the SasaPay B2C request
5. THE Disbursal_Service SHALL follow the SasaPay B2C API specification at https://developer.sasapay.app/docs/apis/b2c
6. WHEN a bank transfer fails, THE Disbursal_Service SHALL log the error and mark the disbursal as failed
7. THE Disbursal_Service SHALL support retry logic for failed bank transfers

### Requirement 7: Disbursal Status Tracking

**User Story:** As a system, I want to track disbursal status throughout the payment lifecycle, so that I can monitor payment completion and handle failures.

#### Acceptance Criteria

1. THE Disbursal_Service SHALL support these disbursal statuses: pending, processing, completed, failed, reversed
2. WHEN a disbursal is initiated, THE Disbursal_Service SHALL create a disbursal record with status "pending"
3. WHEN a disbursal request is sent to SasaPay, THE Disbursal_Service SHALL update status to "processing"
4. WHEN SasaPay confirms successful payment, THE Disbursal_Service SHALL update status to "completed"
5. WHEN SasaPay reports payment failure, THE Disbursal_Service SHALL update status to "failed" and store the error message
6. WHEN an administrator reverses a disbursal, THE Disbursal_Service SHALL update status to "reversed"
7. THE Disbursal_Service SHALL maintain a status history with all transitions and timestamps

### Requirement 8: Disbursal Logic Verification

**User Story:** As a system architect, I want to verify that disbursal logic correctly calculates amounts and routes payments, so that clinics receive accurate payments.

#### Acceptance Criteria

1. WHEN a claim is approved, THE Disbursal_Service SHALL calculate the disbursal amount as the claim amount
2. THE Disbursal_Service SHALL verify that the claim amount does not exceed the member's remaining claim limit
3. THE Disbursal_Service SHALL verify that the member's subscription is active before initiating disbursal
4. WHEN multiple claims exist for the same visit, THE Disbursal_Service SHALL process each disbursal separately
5. THE Disbursal_Service SHALL prevent duplicate disbursals for the same claim
6. WHEN a disbursal fails, THE Disbursal_Service SHALL NOT deduct from the member's claim limit
7. WHEN a disbursal is reversed, THE Disbursal_Service SHALL restore the member's claim limit

### Requirement 9: Payment Callback URL Verification

**User Story:** As a developer, I want to verify that payment callback URLs are correctly generated and formatted, so that SasaPay can successfully notify us of payment status changes.

#### Acceptance Criteria

1. WHEN initiating a payment, THE Payment_Service SHALL generate a callback URL in the format: `{baseUrl}/payments/callback`
2. THE Payment_Service SHALL use the configured API base URL from environment variables
3. WHEN in development environment, THE Payment_Service SHALL use the development API base URL
4. WHEN in production environment, THE Payment_Service SHALL use the production API base URL
5. THE Payment_Service SHALL validate that the callback URL is a valid HTTPS URL before sending to SasaPay
6. THE Payment_Service SHALL log the generated callback URL for debugging purposes
7. WHEN SasaPay calls the callback URL, THE Payment_Service SHALL validate the request signature and process the payment status update

### Requirement 10: Payment Redirect URL Verification

**User Story:** As a developer, I want to verify that payment redirect URLs are correctly generated, so that users are properly redirected after payment completion.

#### Acceptance Criteria

1. WHEN initiating a payment, THE Payment_Service SHALL generate a redirect URL that includes the transaction ID
2. THE Payment_Service SHALL use the configured frontend base URL from environment variables
3. THE Payment_Service SHALL format the redirect URL as: `{frontendBaseUrl}/payment/status?transactionId={id}`
4. WHEN in development environment, THE Payment_Service SHALL use the development frontend base URL
5. WHEN in production environment, THE Payment_Service SHALL use the production frontend base URL
6. THE Payment_Service SHALL validate that the redirect URL is a valid HTTPS URL
7. THE Payment_Service SHALL include the redirect URL in the payment initiation response

### Requirement 11: End-to-End Payment Flow Testing

**User Story:** As a quality assurance engineer, I want to test the complete payment flow with actual callbacks, so that I can verify the system handles all payment scenarios correctly.

#### Acceptance Criteria

1. THE Payment_Service SHALL provide a test endpoint that simulates the complete payment flow
2. THE test endpoint SHALL initiate a payment, wait for callback, and verify claim limit assignment
3. WHEN testing successful payment, THE test SHALL verify that claim limits are assigned after callback
4. WHEN testing failed payment, THE test SHALL verify that claim limits are NOT assigned
5. WHEN testing timeout scenario, THE test SHALL verify that payment status is updated to timeout
6. THE test endpoint SHALL be available only in development and staging environments
7. THE test endpoint SHALL return detailed logs of each step in the payment flow

### Requirement 12: Subscription Tier Claim Limits - Database Enforcement

**User Story:** As a system architect, I want claim limits enforced at the database level, so that the limits are consistently applied across all system components.

#### Acceptance Criteria

1. THE Payment_Service SHALL set annualCapLimit to 6000 (KES) for Bronze tier subscriptions
2. THE Payment_Service SHALL set annualCapLimit to 10000 (KES) for Silver tier subscriptions
3. THE Payment_Service SHALL set annualCapLimit to 15000 (KES) for Gold tier subscriptions
4. WHEN a subscription is created or upgraded, THE Payment_Service SHALL set the annualCapLimit based on the tier
5. WHEN a claim is submitted, THE Payment_Service SHALL verify that the claim amount plus current usage does not exceed annualCapLimit
6. WHEN a claim would exceed the limit, THE Payment_Service SHALL reject the claim with a descriptive error message
7. THE Payment_Service SHALL update annualCapUsed when a claim is approved and disbursed

### Requirement 13: Subscription Tier Claim Limits - Smart Contract Integration

**User Story:** As a blockchain developer, I want claim limits enforced in smart contracts, so that ghost claims cannot be created by bypassing the backend.

#### Acceptance Criteria

1. THE smart contract SHALL store claim limit caps for each tier: Bronze=6000, Silver=10000, Gold=15000
2. WHEN minting a subscription NFT, THE smart contract SHALL record the tier and claim limit
3. WHEN a claim is submitted on-chain, THE smart contract SHALL verify that the claim amount plus current usage does not exceed the tier limit
4. WHEN a claim would exceed the limit, THE smart contract SHALL revert the transaction with an error
5. THE smart contract SHALL track cumulative claim usage per subscription per year
6. THE smart contract SHALL provide a function to query remaining claim limit for a subscription
7. THE smart contract SHALL emit events when claim limits are updated or exceeded

### Requirement 14: Claim Limit Validation at Submission

**User Story:** As a member, I want to know immediately if my claim exceeds my limit, so that I don't submit claims that will be rejected.

#### Acceptance Criteria

1. WHEN a member submits a claim, THE Payment_Service SHALL calculate the total: current annualCapUsed plus new claim amount
2. WHEN the total exceeds annualCapLimit, THE Payment_Service SHALL reject the claim before processing
3. THE Payment_Service SHALL return an error message showing: current usage, limit, claim amount, and excess amount
4. WHEN a claim is within the limit, THE Payment_Service SHALL proceed with claim processing
5. THE Payment_Service SHALL display remaining claim limit on the member dashboard
6. THE Payment_Service SHALL update the remaining limit display after each claim approval
7. THE Payment_Service SHALL prevent claim submission when remaining limit is zero

### Requirement 15: Monthly Payment Waiting Periods

**User Story:** As a system, I want to enforce waiting periods for monthly payment subscribers, so that the subscription model remains financially sustainable.

#### Acceptance Criteria

1. WHEN a subscription has paymentFrequency set to "MONTHLY", THE Payment_Service SHALL enforce waiting periods
2. FOR consultations and extractions, THE Payment_Service SHALL enforce a 60-day waiting period from subscription start date
3. FOR root canal, scaling, filling, and antibiotics, THE Payment_Service SHALL enforce a 90-day waiting period from subscription start date
4. WHEN a member attempts to claim a procedure before the waiting period, THE Payment_Service SHALL reject the claim
5. THE Payment_Service SHALL return an error message showing the procedure, waiting period, and days remaining
6. THE Payment_Service SHALL calculate waiting period from the subscriptionStartDate field
7. THE Payment_Service SHALL display waiting period status on the member dashboard

### Requirement 16: Yearly Payment Immediate Access

**User Story:** As a member who pays yearly, I want immediate access to all covered procedures, so that I receive the benefit of paying upfront.

#### Acceptance Criteria

1. WHEN a subscription has paymentFrequency set to "ANNUAL", THE Payment_Service SHALL enforce a 14-day waiting period for all procedures
2. THE Payment_Service SHALL NOT apply 60-day or 90-day waiting periods to annual subscribers
3. WHEN an annual subscriber attempts to claim after 14 days, THE Payment_Service SHALL allow the claim (subject to other validations)
4. THE Payment_Service SHALL display "Immediate Access (14 days)" messaging for annual subscribers
5. WHEN a member upgrades from monthly to annual, THE Payment_Service SHALL reset the waiting period to 14 days from upgrade date
6. THE Payment_Service SHALL store the payment frequency with each subscription record
7. THE Payment_Service SHALL validate payment frequency is either "MONTHLY" or "ANNUAL"

### Requirement 17: Waiting Period Implementation in Subscription Service

**User Story:** As a developer, I want waiting period logic centralized in the subscription service, so that it's consistently applied across all claim validations.

#### Acceptance Criteria

1. THE subscription service SHALL provide a checkWaitingPeriod function that accepts memberId and procedureCode
2. THE checkWaitingPeriod function SHALL return: passed (boolean), daysRemaining (number), requiredDays (number)
3. THE function SHALL query the subscription record to get paymentFrequency and subscriptionStartDate
4. THE function SHALL calculate days since subscription start
5. THE function SHALL determine required waiting days based on payment frequency and procedure type
6. THE function SHALL return passed=true when days since start >= required days
7. THE function SHALL be called before any claim submission or approval

### Requirement 18: Waiting Period Status Display

**User Story:** As a member, I want to see my waiting period status for each procedure type, so that I know when I can submit claims.

#### Acceptance Criteria

1. THE member dashboard SHALL display waiting period status for each procedure category
2. FOR each procedure category, THE dashboard SHALL show: procedure name, waiting period duration, days remaining or "Available"
3. WHEN a waiting period is active, THE dashboard SHALL display a countdown: "Available in X days"
4. WHEN a waiting period has passed, THE dashboard SHALL display "Available Now"
5. THE dashboard SHALL use different colors: red for unavailable, yellow for waiting, green for available
6. THE dashboard SHALL update waiting period status in real-time as days pass
7. THE dashboard SHALL explain the difference between monthly and annual waiting periods

### Requirement 19: Yearly Payment Option - Frontend Display

**User Story:** As a member, I want to see both monthly and yearly payment options, so that I can choose the payment frequency that works best for me.

#### Acceptance Criteria

1. THE payment interface SHALL display both monthly and yearly payment options side by side
2. FOR each option, THE interface SHALL display: payment frequency, amount, total annual cost, and key benefits
3. THE yearly option SHALL display the calculated amount as: monthlyAmount \* 12
4. THE yearly option SHALL highlight benefits: "Immediate access (14 days)", "No 60/90 day waiting periods", "Save on transaction fees"
5. THE monthly option SHALL display: "60-day wait for consultations/extractions", "90-day wait for restorative procedures"
6. THE interface SHALL use visual design to make the yearly option more prominent (recommended badge)
7. THE interface SHALL allow the user to select one option before proceeding to payment

### Requirement 20: Yearly Payment Calculation

**User Story:** As a system, I want to correctly calculate yearly payment amounts, so that members are charged the right amount for annual subscriptions.

#### Acceptance Criteria

1. WHEN a member selects yearly payment, THE Payment_Service SHALL calculate the amount as: tier monthly price \* 12
2. THE Payment_Service SHALL use the current tier pricing from the database
3. THE Payment_Service SHALL validate that the calculated amount matches the expected yearly amount
4. THE Payment_Service SHALL store the payment frequency as "ANNUAL" with the subscription record
5. THE Payment_Service SHALL set the subscriptionStartDate to the payment confirmation date
6. THE Payment_Service SHALL set the subscription end date to 365 days from start date
7. THE Payment_Service SHALL display the exact yearly amount in the payment prompt

### Requirement 21: Yearly Payment Prompt Integration

**User Story:** As a member, I want the payment prompt to show the correct yearly amount, so that I know exactly what I'm paying.

#### Acceptance Criteria

1. WHEN a member confirms yearly payment, THE frontend SHALL trigger the SasaPay payment prompt with the yearly amount
2. THE payment prompt SHALL display the amount in KES with proper formatting
3. THE payment prompt SHALL include a description: "MenoDAO Annual Subscription - {Tier}"
4. THE payment prompt SHALL use the member's registered phone number
5. THE payment prompt SHALL include the transaction reference for tracking
6. WHEN the payment prompt is displayed, THE frontend SHALL show a loading state
7. WHEN the payment is completed or cancelled, THE frontend SHALL redirect to the payment status page

### Requirement 22: Yearly Payment Benefits Display

**User Story:** As a member, I want to clearly see the benefits of yearly payment, so that I can make an informed decision.

#### Acceptance Criteria

1. THE payment interface SHALL display a comparison table showing monthly vs yearly benefits
2. THE comparison SHALL include: waiting periods, total annual cost, transaction fees, and access timeline
3. THE yearly option SHALL show: "Immediate access to all procedures after 14 days"
4. THE monthly option SHALL show: "60-day wait for consultations, 90-day wait for restorative procedures"
5. THE yearly option SHALL show potential savings: "Save up to X KES on transaction fees"
6. THE interface SHALL use icons and visual indicators to make benefits clear
7. THE interface SHALL include a tooltip or info icon explaining each benefit

### Requirement 23: Payment Frequency Migration

**User Story:** As a system administrator, I want to migrate existing subscriptions to include payment frequency, so that the system works correctly for all members.

#### Acceptance Criteria

1. THE migration script SHALL set paymentFrequency to "MONTHLY" for all existing subscriptions without a frequency value
2. THE migration script SHALL preserve all other subscription data
3. THE migration script SHALL log each subscription updated
4. THE migration script SHALL provide a rollback mechanism
5. THE migration script SHALL validate data integrity after migration
6. THE migration script SHALL run as a one-time database migration
7. THE migration script SHALL be idempotent (safe to run multiple times)

### Requirement 24: Admin Panel - Payment Reconciliation

**User Story:** As an administrator, I want to reconcile payments with SasaPay records, so that I can identify and fix discrepancies.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Reconcile Payments" tool that queries SasaPay for transaction status
2. THE tool SHALL accept a date range and return all payments in that range
3. FOR each payment, THE tool SHALL compare local status with SasaPay status
4. WHEN statuses differ, THE tool SHALL highlight the discrepancy
5. THE tool SHALL provide a "Sync Status" action that updates local records to match SasaPay
6. THE tool SHALL log all reconciliation actions
7. THE tool SHALL generate a reconciliation report showing: total payments, matched, mismatched, and corrected

### Requirement 25: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can debug issues and monitor system health.

#### Acceptance Criteria

1. THE Payment_Service SHALL log all payment initiations with transaction ID, amount, and user ID
2. THE Payment_Service SHALL log all callback receipts with payload and signature validation result
3. THE Disbursal_Service SHALL log all disbursal attempts with clinic ID, amount, and payment channel
4. WHEN an error occurs, THE system SHALL log the full error context including stack trace
5. THE system SHALL use structured logging with consistent field names
6. THE system SHALL log at appropriate levels: DEBUG for detailed flow, INFO for key events, WARN for recoverable errors, ERROR for failures
7. THE system SHALL include correlation IDs to trace requests across services
