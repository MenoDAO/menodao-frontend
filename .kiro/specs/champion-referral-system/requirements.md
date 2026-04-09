# Requirements Document

## Introduction

The Champion Referral System transforms every MenoDAO member into an ambassador ("Champion") who can invite family, friends, and Chama members to join the platform. The system generates a unique referral code per member, tracks referrals, credits 10% cash commissions on referred users' first confirmed subscription payments, and awards a free Gold-tier monthly premium waiver to Champions who maintain 25 or more active paying referrals. A dedicated Champion Dashboard surfaces all referral and commission data to members, and admins can view referral data per user.

This system must be introduced surgically into the existing NestJS/Prisma backend and Next.js frontend without breaking any live functionality.

---

## Glossary

- **Champion**: Any registered MenoDAO member; every member is automatically a Champion.
- **Referral_Code**: A unique, human-readable code derived from the Champion's first name (uppercase) and the last 4 digits of their phone number, separated by an underscore (e.g., `AMINA_5678`).
- **Invite_Link**: A URL containing the Champion's Referral_Code as a query parameter, used to pre-fill the referral code on the sign-up page.
- **Referred_User**: A new member who registered using a Champion's Invite_Link or Referral_Code.
- **First_Payment**: The first confirmed (COMPLETED status) subscription contribution made by a Referred_User.
- **Commission**: 10% of a Referred_User's First_Payment amount, credited to the referring Champion's commissions balance in KES.
- **Active_Referral**: A Referred_User whose subscription is currently active and paying (isActive = true and has at least one COMPLETED contribution).
- **Gold_Member**: A Champion who currently has 25 or more Active_Referrals; their own monthly MenoDAO premium is 100% waived.
- **Champion_Dashboard**: A section embedded within the existing authenticated member dashboard, accessible via a dedicated sidebar navigation item, showing a Champion's referral statistics, commission earnings, and Gold Member status.
- **Leaderboard**: A publicly accessible page displaying the top Champions ranked by active referral count, showing only privacy-safe fields.
- **Referral_Service**: The NestJS service responsible for referral code generation, commission calculation, and Gold Member status evaluation.
- **Commission_Ledger**: The record of all commission credits and withdrawals for a Champion.
- **Withdrawal_Record**: A database record representing a Champion's request to withdraw commission funds, with statuses: PENDING_ADMIN_APPROVAL, APPROVED, REJECTED, FAILED, COMPLETED.
- **System**: The MenoDAO platform (backend + frontend) as a whole.

---

## Requirements

### Requirement 1: Referral Code Generation

**User Story:** As a MenoDAO member, I want a unique referral code automatically assigned to me when I register, so that I can share it with others to earn commissions.

#### Acceptance Criteria

1. WHEN a new Member is created, THE Referral_Service SHALL generate a Referral_Code in the format `FIRSTNAME_XXXX`, where `FIRSTNAME` is the uppercase first word of the member's `fullName` and `XXXX` is the last 4 digits of the member's `phoneNumber`.
2. THE Referral_Service SHALL store the generated Referral_Code on the Member record in a dedicated `referralCode` field.
3. IF a generated Referral_Code already exists on another Member record, THEN THE Referral_Service SHALL append a 2-digit numeric suffix (e.g., `AMINA_5678_01`) to produce a unique code.
4. THE Referral_Service SHALL generate the Referral_Code at member creation time and SHALL NOT change it after generation.
5. WHEN a member's `fullName` or `phoneNumber` is not yet available at creation time, THE Referral_Service SHALL defer code generation until both fields are present and SHALL generate the code on the next profile update that provides both fields.

---

### Requirement 2: Referral Tracking Fields

**User Story:** As a MenoDAO member, I want the system to track who referred me and my referral activity, so that commissions and benefits are correctly attributed.

#### Acceptance Criteria

1. THE System SHALL store a `referredBy` field on each Member record containing the Referral_Code of the Champion who referred them, or null if the member registered without a referral code.
2. THE System SHALL store a `firstPaymentCleared` boolean field on each Member record, defaulting to false, which is set to true when the member's first subscription contribution reaches COMPLETED status.
3. THE System SHALL store a `commissionsBalance` integer field (KES, in whole shillings) on each Member record, defaulting to 0, representing the Champion's accumulated unwithdrawable commission balance.
4. THE System SHALL store an `activeReferralsCount` integer field on each Member record, defaulting to 0, representing the current count of Active_Referrals for that Champion.
5. THE System SHALL store an `isGoldMember` boolean field on each Member record, defaulting to false, representing whether the Champion currently qualifies for the free Gold package benefit.
6. THE System SHALL store a `commissionsWithdrawn` integer field (KES) on each Member record, defaulting to 0, representing the total amount withdrawn from commissions to date.

---

### Requirement 3: Commission Crediting

**User Story:** As a Champion, I want to earn a 10% cash commission when someone I referred makes their first confirmed subscription payment, so that I am rewarded for growing the MenoDAO community.

#### Acceptance Criteria

1. WHEN a Referred_User's subscription contribution transitions to COMPLETED status AND the Referred_User's `firstPaymentCleared` is false, THE Referral_Service SHALL calculate a Commission equal to 10% of the contribution amount (rounded down to the nearest whole KES).
2. WHEN the Commission is calculated, THE Referral_Service SHALL credit the Commission to the referring Champion's `commissionsBalance` by incrementing it by the Commission amount.
3. WHEN the Commission is credited, THE Referral_Service SHALL set the Referred_User's `firstPaymentCleared` field to true.
4. WHEN the Commission is credited, THE Referral_Service SHALL create a Commission_Ledger entry recording the commission amount, the Referred_User's member ID, the contribution ID, and the timestamp.
5. IF a Referred_User has no `referredBy` value, THEN THE Referral_Service SHALL NOT credit any commission.
6. IF a Referred_User's `firstPaymentCleared` is already true, THEN THE Referral_Service SHALL NOT credit a commission for any subsequent payments by that Referred_User.
7. THE Referral_Service SHALL process commission crediting within the same database transaction as the payment confirmation to ensure consistency.

---

### Requirement 4: Active Referral Count Maintenance

**User Story:** As a Champion, I want my active referral count to reflect only currently active and paying referrals, so that my Gold Member status is accurately determined.

#### Acceptance Criteria

1. WHEN a Referred_User's subscription becomes active (isActive transitions to true) AND the Referred_User has at least one COMPLETED contribution, THE Referral_Service SHALL increment the referring Champion's `activeReferralsCount` by 1.
2. WHEN a Referred_User's subscription becomes inactive (isActive transitions to false), THE Referral_Service SHALL decrement the referring Champion's `activeReferralsCount` by 1, with a minimum value of 0.
3. THE Referral_Service SHALL recalculate `activeReferralsCount` for a Champion by counting all Members where `referredBy` equals the Champion's Referral_Code AND `firstPaymentCleared` is true AND the Member's subscription `isActive` is true.
4. WHEN `activeReferralsCount` is updated, THE Referral_Service SHALL immediately evaluate and update the Champion's `isGoldMember` status per Requirement 5.

---

### Requirement 5: Gold Member Status

**User Story:** As a Champion with 25 or more active paying referrals, I want my own monthly MenoDAO premium to be waived, so that I am rewarded for maintaining a large active referral network.

#### Acceptance Criteria

1. WHEN a Champion's `activeReferralsCount` reaches 25 or more, THE Referral_Service SHALL set the Champion's `isGoldMember` field to true.
2. WHEN a Champion's `activeReferralsCount` drops below 25, THE Referral_Service SHALL set the Champion's `isGoldMember` field to false.
3. WHILE a Champion's `isGoldMember` is true, THE System SHALL waive the Champion's own monthly subscription payment, treating their subscription as paid for the current billing cycle.
4. WHEN the System waives a Champion's monthly premium, THE Referral_Service SHALL create a Contribution record for the Champion with a status of `WAIVED`, the correct monthly amount for the Champion's tier, and a `waivedReason` metadata field set to `"gold_champion_benefit"`, so that a full audit trail is preserved.
5. WHILE a Champion's `isGoldMember` is true, THE System SHALL display a "Gold Champion" badge on the Champion's dashboard and profile.
6. THE Referral_Service SHALL evaluate Gold Member status dynamically on every change to `activeReferralsCount` and SHALL NOT cache the result beyond the current request.

---

### Requirement 6: Invite Link and Social Sharing

**User Story:** As a Champion, I want a personalized invite link and a native share option, so that I can easily invite friends and Chama members across any app on my device.

#### Acceptance Criteria

1. THE System SHALL generate an Invite_Link for each Champion in the format `{BASE_URL}/sign-up?ref={REFERRAL_CODE}`, where `BASE_URL` is the frontend application base URL.
2. THE Champion_Dashboard SHALL display the Champion's Invite_Link and provide a "Copy Link" button that copies the link to the device clipboard.
3. WHEN the "Share" button is activated, THE Champion_Dashboard SHALL invoke the Web Share API (`navigator.share`) with the pre-filled message: "Here's your personal invite link! Forward this message to your friends and Chama members. You earn 10% commission for every person who makes their first premium payment! {INVITE_LINK}".
4. IF the Web Share API is not available in the current browser, THEN THE Champion_Dashboard SHALL fall back to displaying the Invite_Link in a copyable text field.
5. THE System SHALL accept a `ref` query parameter on the sign-up page and SHALL pre-fill the referral code field in the sign-up form with the value of that parameter.
6. WHEN a new member completes sign-up with a pre-filled referral code, THE System SHALL store the referral code value in the member's `referredBy` field.
7. IF the `ref` query parameter value does not match any existing Referral_Code, THEN THE System SHALL ignore the parameter and SHALL NOT set `referredBy`.

---

### Requirement 7: Champion Dashboard

**User Story:** As a Champion, I want a dedicated dashboard page showing all my referral and commission data, so that I can track my earnings and referral network at a glance.

#### Acceptance Criteria

1. THE Champion_Dashboard SHALL display the Champion's Referral_Code and Invite_Link prominently.
2. THE Champion_Dashboard SHALL display the Champion's total referral count (all-time referrals who signed up using their code).
3. THE Champion_Dashboard SHALL display the Champion's `activeReferralsCount` (currently active and paying referrals).
4. THE Champion_Dashboard SHALL display the Champion's total commissions earned (sum of all Commission_Ledger credits).
5. THE Champion_Dashboard SHALL display the Champion's `commissionsWithdrawn` amount.
6. THE Champion_Dashboard SHALL display the Champion's current `commissionsBalance` (earned minus withdrawn).
7. THE Champion_Dashboard SHALL display the Champion's `isGoldMember` status and, when true, show the benefits summary: "Your monthly premium is waived. You have 25+ active paying referrals."
8. THE Champion_Dashboard SHALL display a paginated list of the Champion's referrals, showing for each: full name (or masked phone number if name is unavailable), registration date, and whether their first payment has been cleared.
9. WHEN the Champion_Dashboard data is loading, THE Champion_Dashboard SHALL display a loading skeleton to prevent layout shift.
10. THE Champion_Dashboard SHALL be embedded within the existing authenticated member dashboard and SHALL be accessible via a new "Champion" sidebar navigation item added to the existing dashboard sidebar.
11. THE Champion_Dashboard SHALL be accessible at the route `/dashboard/champion` within the authenticated member dashboard.

---

### Requirement 11: Champion Leaderboard

**User Story:** As a MenoDAO member or visitor, I want to see a public leaderboard of top Champions, so that I can be inspired to participate and the community can celebrate top contributors.

#### Acceptance Criteria

1. THE System SHALL expose a public API endpoint `GET /champions/leaderboard` that returns the top Champions ranked by `activeReferralsCount` in descending order, limited to the top 50 entries.
2. THE Leaderboard endpoint SHALL return only the following fields for each Champion: first name, Referral_Code, total referral count, member since date (account creation date), and total commissions earned.
3. THE Leaderboard endpoint SHALL NOT return any of the following fields: last name, phone number, full address, email, `commissionsBalance`, or any other personally identifiable information beyond first name.
4. THE System SHALL display the Leaderboard on a publicly accessible frontend page at the route `/leaderboard`, requiring no authentication to view.
5. THE Leaderboard page SHALL display each Champion's rank, first name, Referral_Code, referral count, member since date, and total amount earned.
6. WHEN the Leaderboard data is loading, THE Leaderboard page SHALL display a loading skeleton.
7. THE System SHALL cache the Leaderboard API response for a maximum of 5 minutes to reduce database load.

---

### Requirement 8: Admin Referral Visibility

**User Story:** As an admin, I want to see referral data for any member, so that I can audit the referral system and resolve disputes.

#### Acceptance Criteria

1. WHEN an admin views a member's detail page, THE System SHALL display the member's `referralCode`, `referredBy`, `firstPaymentCleared`, `commissionsBalance`, `commissionsWithdrawn`, `activeReferralsCount`, and `isGoldMember` fields.
2. THE System SHALL provide an admin API endpoint `GET /admin/members/:id/referrals` that returns the member's referral summary and a list of all members they referred, including each referred member's name, phone number, registration date, and `firstPaymentCleared` status.
3. THE System SHALL include referral fields in the existing admin member search and detail responses without requiring a separate lookup.

---

### Requirement 9: Commission Withdrawal

**User Story:** As a Champion, I want to be able to request a withdrawal of my commission balance, so that I can receive the cash I have earned.

#### Acceptance Criteria

1. THE Champion_Dashboard SHALL display a "Withdraw" button only when the Champion's `commissionsBalance` is greater than or equal to KES 200.
2. WHEN a Champion's `commissionsBalance` is below KES 200, THE Champion_Dashboard SHALL display the current balance and a message indicating the minimum withdrawal threshold of KES 200 has not yet been met.
3. WHEN a Champion submits a withdrawal request, THE System SHALL create a withdrawal record with the requested amount, the Champion's member ID, and a PENDING status.
4. THE System SHALL validate that the requested withdrawal amount does not exceed the Champion's current `commissionsBalance`.
5. IF the requested withdrawal amount exceeds the Champion's `commissionsBalance`, THEN THE System SHALL return an error message: "Withdrawal amount exceeds your available balance."
6. WHEN a Champion submits their first-ever withdrawal request (i.e., `commissionsWithdrawn` is 0), THE System SHALL set the withdrawal record status to PENDING_ADMIN_APPROVAL and SHALL NOT automatically disburse the funds until an admin approves the request.
7. WHEN an admin approves a first-payout withdrawal request, THE System SHALL update the withdrawal record status to APPROVED and SHALL trigger automated disbursement via the SasaPay Disbursal API to the Champion's registered phone number.
8. WHEN a Champion submits a subsequent withdrawal request (i.e., `commissionsWithdrawn` is greater than 0 and a prior withdrawal has been approved), THE System SHALL automatically disburse the funds via the SasaPay Disbursal API without requiring admin approval.
9. WHEN a withdrawal is successfully disbursed, THE System SHALL decrement the Champion's `commissionsBalance` by the withdrawn amount and increment `commissionsWithdrawn` by the same amount.
10. IF the SasaPay Disbursal API returns a failure response, THEN THE System SHALL set the withdrawal record status to FAILED, SHALL NOT modify `commissionsBalance` or `commissionsWithdrawn`, and SHALL log the error for admin review.
11. THE System SHALL expose an admin endpoint to list all withdrawal requests filtered by status (PENDING_ADMIN_APPROVAL, APPROVED, FAILED, COMPLETED), and to approve or reject first-payout requests.
12. WHEN an admin rejects a first-payout withdrawal request, THE System SHALL set the withdrawal record status to REJECTED and SHALL notify the Champion via SMS with the reason for rejection.

---

### Requirement 12: Commission Withdrawal — Package Tier Amounts

**User Story:** As a Champion, I want my commission to correctly reflect the premium amount for the tier my referred member subscribed to, so that my earnings accurately represent the value of each referral.

#### Acceptance Criteria

1. THE Referral_Service SHALL calculate the Commission for a Referred_User's First_Payment as 10% of the actual contribution amount recorded on the COMPLETED Contribution record, regardless of tier.
2. THE System SHALL record the tier of the Referred_User's subscription at the time of first payment in the Commission_Ledger entry for full auditability.
3. THE Champion_Dashboard SHALL display a breakdown of commissions earned per referral, showing the referred member's tier and the commission amount credited.

---

### Requirement 10: Data Integrity and Non-Breaking Integration

**User Story:** As a platform operator, I want the referral system to integrate with the existing payment and subscription flows without disrupting live users, so that the production system remains stable.

#### Acceptance Criteria

1. THE System SHALL add all new referral fields to the Member model via an additive Prisma migration that does not alter or drop any existing columns.
2. THE System SHALL hook commission crediting into the existing `processCallback` method in `PaymentService` without modifying the method's existing logic or return type.
3. THE System SHALL hook active referral count updates into the existing subscription activation logic in `PaymentService` without modifying the method's existing logic or return type.
4. IF the Referral_Service throws an error during commission crediting, THEN THE System SHALL log the error and SHALL NOT fail the payment callback response.
5. THE System SHALL ensure all new database queries use indexed fields to avoid full-table scans on the Member table.
6. THE System SHALL add database indexes on `Member.referralCode` and `Member.referredBy` fields.
