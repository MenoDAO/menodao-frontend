# Requirements Document

## Introduction

This specification addresses critical payment flow bugs and user experience improvements in the MenoDAO subscription system. The primary focus is fixing a critical bug where claim limits are activated prematurely before payment confirmation, along with several UI/UX enhancements to improve clarity, consistency, and usability throughout the payment and subscription flows.

## Glossary

- **System**: The MenoDAO subscription and payment platform
- **Claim_Limit**: The maximum KES amount a member can claim for dental treatments based on their subscription tier
- **Payment_Confirmation**: Verification that a payment transaction has been successfully completed
- **Subscription_Tier**: A membership level (Bronze, Silver, Gold) with associated benefits
- **Payment_Frequency**: The billing cycle chosen by the user (monthly or yearly)
- **M-Pesa**: Mobile money payment system used for transactions
- **Admin_Panel**: Administrative interface for managing the platform
- **Waiting_Period**: Time period before certain benefits become active
- **Checkout_Amount**: The total amount to be paid for a subscription

## Requirements

### Requirement 1: Prevent Premature Claim Limit Activation

**User Story:** As a system administrator, I want claim limits to only activate after successful payment confirmation, so that users cannot access benefits they haven't paid for.

#### Acceptance Criteria

1. WHEN a user selects a subscription package, THE System SHALL NOT update the claim limit until payment is confirmed
2. WHEN a user navigates through the payment flow, THE System SHALL maintain the user's previous claim limit until payment confirmation
3. WHEN a payment is successfully confirmed, THEN THE System SHALL update the claim limit to match the purchased subscription tier
4. IF a payment fails or is cancelled, THEN THE System SHALL preserve the user's existing claim limit unchanged
5. WHEN checking claim limit status, THE System SHALL only consider payments with confirmed status

### Requirement 2: Remove Debug Logging

**User Story:** As a developer, I want all console.log statements removed from production code, so that the application maintains clean console output and doesn't expose internal information.

#### Acceptance Criteria

1. THE System SHALL NOT contain console.log statements in the admin panel dashboard components
2. THE System SHALL NOT contain console.log statements in frontend payment flow components
3. THE System SHALL NOT contain console.log statements in backend payment processing code
4. WHERE logging is necessary for debugging, THE System SHALL use proper logging frameworks instead of console.log
5. WHEN the application runs in production, THE System SHALL have clean console output without debug messages

### Requirement 3: Improve Payment Plan Dialog Responsiveness

**User Story:** As a user, I want the payment plan selection dialog to be properly formatted, so that I can easily read and select my preferred payment option.

#### Acceptance Criteria

1. WHEN the payment plan dialog is displayed, THE System SHALL remove excessive top padding above the subscription tier text
2. WHEN the dialog is rendered on mobile devices, THE System SHALL maintain proper spacing and readability
3. WHEN the dialog is rendered on desktop devices, THE System SHALL maintain proper spacing and readability
4. THE System SHALL display the text "select how you'd like to pay for your <tier> subscription" with appropriate spacing from dialog edges

### Requirement 4: Standardize Tier Name Formatting

**User Story:** As a user, I want consistent tier naming throughout the application, so that I can easily recognize my subscription level.

#### Acceptance Criteria

1. THE System SHALL prefix all tier names with "Meno" throughout the application
2. WHEN displaying Bronze tier, THE System SHALL show "MenoBronze"
3. WHEN displaying Silver tier, THE System SHALL show "MenoSilver"
4. WHEN displaying Gold tier, THE System SHALL show "MenoGold"
5. THE System SHALL apply this naming convention in all UI components, API responses, and database displays

### Requirement 5: Clarify Payment Frequency Selection

**User Story:** As a user, I want to clearly see which payment option I selected, so that I can confirm my choice before proceeding to payment.

#### Acceptance Criteria

1. WHEN a user selects monthly payment, THE System SHALL visually highlight the monthly option
2. WHEN a user selects yearly payment, THE System SHALL visually highlight the yearly option
3. WHEN a payment frequency is selected, THE System SHALL display confirmation text indicating the chosen frequency
4. THE System SHALL maintain the visual indication of the selected option throughout the payment flow
5. WHEN displaying the payment summary, THE System SHALL explicitly state the selected payment frequency

### Requirement 6: Display Expected Checkout Amount

**User Story:** As a user, I want to see the exact amount I'll be charged before entering my phone number, so that I can verify the cost before initiating payment.

#### Acceptance Criteria

1. WHEN the phone number entry screen is displayed, THE System SHALL show the expected checkout amount prominently
2. THE System SHALL display the amount in KES currency format
3. THE System SHALL include the subscription tier name with the amount
4. THE System SHALL include the payment frequency (monthly/yearly) with the amount
5. WHEN the amount is displayed, THE System SHALL ensure it matches the selected tier and payment frequency

### Requirement 7: Improve Waiting Period Text Legibility

**User Story:** As a user, I want to easily read the waiting periods information, so that I understand when my benefits will become active.

#### Acceptance Criteria

1. WHEN waiting period text is displayed, THE System SHALL ensure sufficient contrast between text and background colors
2. THE System SHALL use bold font weight for waiting period labels or values
3. WHEN waiting period information is shown on the dashboard, THE System SHALL meet WCAG AA contrast ratio standards
4. THE System SHALL ensure waiting period text is readable on both light and dark backgrounds
5. WHEN displaying multiple waiting periods, THE System SHALL maintain consistent text styling across all items
