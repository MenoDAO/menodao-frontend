# Requirements Document

## Introduction

This specification addresses a critical issue in the payment verification system where users receive claim limits before payment confirmation is complete. The current implementation assigns claim limits immediately after payment initiation, leading to "ghost-success" scenarios where users have active claim limits despite pending or failed payments. This enhancement implements a robust payment verification system using SasaPay's transaction status API with polling to ensure claim limits are only assigned after confirmed successful payments.

## Glossary

- **Payment_Service**: The backend service responsible for processing payments and verifying payment status
- **SasaPay_API**: The third-party payment provider API used for processing transactions
- **Transaction_Status_Endpoint**: SasaPay API endpoint that returns current payment status and retriggers webhooks
- **Claim_Limit**: The number of dental treatment claims a user can make based on their subscription
- **Payment_Status**: The current state of a payment transaction (pending, success, failed, cancelled)
- **Polling_Service**: Service that periodically checks payment status until confirmation
- **Webhook**: HTTP callback from SasaPay to notify payment status changes
- **Ghost_Success**: A scenario where a user has active claim limits despite payment not being confirmed

## Requirements

### Requirement 1: Payment Status Polling

**User Story:** As a system, I want to poll the SasaPay transaction status endpoint, so that I can verify payment completion before assigning claim limits.

#### Acceptance Criteria

1. WHEN a payment is initiated, THE Payment_Service SHALL store the transaction ID and initial status as "pending"
2. WHEN a payment is in "pending" status, THE Polling_Service SHALL query the SasaPay transaction status endpoint every 5 seconds
3. WHEN the transaction status endpoint is queried, THE SasaPay_API SHALL retrigger the webhook to the callback URL
4. THE Polling_Service SHALL continue polling for a maximum of 5 minutes
5. WHEN the polling duration exceeds 5 minutes, THE Polling_Service SHALL mark the transaction as "timeout" and stop polling
6. WHEN the transaction status changes to "success" or "failed", THE Polling_Service SHALL stop polling

### Requirement 2: Claim Limit Assignment Control

**User Story:** As a system administrator, I want claim limits assigned only after payment confirmation, so that users cannot access services without valid payment.

#### Acceptance Criteria

1. WHEN a payment is initiated, THE Payment_Service SHALL NOT assign claim limits immediately
2. WHEN a payment status is "pending", THE Payment_Service SHALL NOT assign claim limits
3. WHEN a payment status changes to "success", THE Payment_Service SHALL assign the appropriate claim limits to the user
4. WHEN a payment status is "failed" or "cancelled", THE Payment_Service SHALL NOT assign claim limits
5. WHEN a payment times out, THE Payment_Service SHALL NOT assign claim limits and SHALL notify the user

### Requirement 3: Transaction Status API Integration

**User Story:** As a developer, I want to integrate with the SasaPay transaction status API, so that I can retrieve accurate payment status information.

#### Acceptance Criteria

1. THE Payment_Service SHALL call the SasaPay transaction status endpoint with the transaction ID
2. THE Payment_Service SHALL include proper authentication headers in the API request
3. WHEN the API call succeeds, THE Payment_Service SHALL parse the response and extract the payment status
4. WHEN the API call fails, THE Payment_Service SHALL retry up to 3 times with exponential backoff
5. WHEN all retries fail, THE Payment_Service SHALL log the error and continue polling on the next interval

### Requirement 4: Payment State Management

**User Story:** As a system, I want to track payment states accurately, so that I can handle all payment scenarios correctly.

#### Acceptance Criteria

1. THE Payment_Service SHALL store payment records with fields: transactionId, userId, amount, status, createdAt, updatedAt
2. WHEN a payment status changes, THE Payment_Service SHALL update the payment record with the new status and timestamp
3. THE Payment_Service SHALL support these payment statuses: "pending", "success", "failed", "cancelled", "timeout"
4. WHEN a payment transitions from "pending" to "success", THE Payment_Service SHALL record the confirmation timestamp
5. THE Payment_Service SHALL maintain an audit log of all status transitions

### Requirement 5: Webhook Handling

**User Story:** As a system, I want to handle SasaPay webhooks properly, so that I can receive payment status updates in real-time.

#### Acceptance Criteria

1. WHEN a webhook is received from SasaPay, THE Payment_Service SHALL validate the webhook signature
2. WHEN the webhook signature is invalid, THE Payment_Service SHALL reject the request and log a security warning
3. WHEN the webhook signature is valid, THE Payment_Service SHALL extract the transaction ID and payment status
4. WHEN the webhook contains a status update, THE Payment_Service SHALL update the payment record
5. WHEN the webhook indicates "success", THE Payment_Service SHALL trigger claim limit assignment

### Requirement 6: User Notification

**User Story:** As a user, I want to be notified about my payment status, so that I know whether my subscription is active.

#### Acceptance Criteria

1. WHEN a payment is confirmed as "success", THE Payment_Service SHALL send a success notification to the user
2. WHEN a payment fails, THE Payment_Service SHALL send a failure notification with retry instructions
3. WHEN a payment times out, THE Payment_Service SHALL send a notification asking the user to check their payment status
4. THE Payment_Service SHALL include the transaction ID in all payment notifications
5. WHEN claim limits are assigned, THE Payment_Service SHALL include the claim limit details in the success notification

### Requirement 7: Existing Payment Reconciliation

**User Story:** As a system administrator, I want to identify and fix existing ghost-success payments, so that the system state is accurate.

#### Acceptance Criteria

1. THE Payment_Service SHALL provide an endpoint to query all payments with "pending" status older than 10 minutes
2. THE Payment_Service SHALL provide an endpoint to manually verify a payment by transaction ID
3. WHEN manually verifying a payment, THE Payment_Service SHALL query the SasaPay status endpoint and update the local record
4. THE Payment_Service SHALL provide an endpoint to revoke claim limits for unconfirmed payments
5. THE Payment_Service SHALL log all manual reconciliation actions for audit purposes

### Requirement 8: Error Handling and Resilience

**User Story:** As a system, I want to handle errors gracefully, so that temporary failures don't prevent payment verification.

#### Acceptance Criteria

1. WHEN the SasaPay API is unavailable, THE Polling_Service SHALL continue retrying until the timeout period
2. WHEN a network error occurs, THE Payment_Service SHALL log the error and retry on the next polling interval
3. WHEN the database is unavailable, THE Payment_Service SHALL queue status updates in memory and persist when available
4. WHEN an unexpected error occurs, THE Payment_Service SHALL log the full error context and continue operation
5. THE Payment_Service SHALL expose health check endpoints that include payment service status

### Requirement 9: Performance and Scalability

**User Story:** As a system architect, I want the polling system to be efficient, so that it can handle multiple concurrent payments.

#### Acceptance Criteria

1. THE Polling_Service SHALL use a job queue to manage concurrent payment verifications
2. THE Polling_Service SHALL limit concurrent SasaPay API calls to 10 requests per second
3. WHEN multiple payments are pending, THE Polling_Service SHALL distribute polling intervals evenly
4. THE Polling_Service SHALL use connection pooling for database queries
5. THE Polling_Service SHALL clean up completed polling jobs from memory after 24 hours
