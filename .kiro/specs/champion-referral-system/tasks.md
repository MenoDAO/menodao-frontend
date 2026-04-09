# Implementation Plan: Champion Referral System

## Overview

Additive integration of the Champion Referral System into the existing NestJS/Prisma backend and Next.js frontend. All changes are surgical and non-breaking. Commission crediting and active-referral-count updates use a fire-and-forget pattern so payment callbacks are never blocked.

## Tasks

- [x] 1. Phase 1 — Database Schema & Migration
  - [x] 1.1 Add referral fields to the Member model in `menodao-backend/prisma/schema.prisma`
    - Add `referralCode String? @unique`, `referredBy String?`, `firstPaymentCleared Boolean @default(false)`, `commissionsBalance Int @default(0)`, `commissionsWithdrawn Int @default(0)`, `activeReferralsCount Int @default(0)`, `isGoldMember Boolean @default(false)`
    - Add `@@index([referralCode])` and `@@index([referredBy])` to Member model
    - Add `commissionLedger CommissionLedger[]` and `withdrawalRecords WithdrawalRecord[]` relations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.1, 10.5, 10.6_

  - [x] 1.2 Add `CommissionLedger` and `WithdrawalRecord` models and `WithdrawalStatus` enum to `schema.prisma`
    - `CommissionLedger`: id, championId, referredUserId, contributionId, amount (Int), tier (PackageTier), createdAt; indexes on championId and createdAt
    - `WithdrawalRecord`: id, championId, amount (Int), status (WithdrawalStatus), sasaPayRequestId?, mpesaReceiptNumber?, errorMessage?, rejectionReason?, createdAt, updatedAt, approvedAt?, completedAt?; indexes on championId, status, createdAt
    - `WithdrawalStatus` enum: PENDING, PENDING_ADMIN_APPROVAL, APPROVED, REJECTED, FAILED, COMPLETED
    - _Requirements: 3.4, 9.3, 9.7_

  - [x] 1.3 Generate and apply the Prisma migration
    - Run `npx prisma migrate dev --name add_champion_referral_system` in `menodao-backend/`
    - Verify migration SQL is additive only (no DROP or ALTER of existing columns)
    - Verify `npx prisma generate` succeeds with no type errors
    - _Requirements: 10.1_

- [x] 2. Phase 2 — ReferralService Core Logic
  - [x] 2.1 Create `menodao-backend/src/referrals/referral.service.ts` with referral code generation
    - Implement `generateReferralCode(fullName: string, phoneNumber: string): Promise<string>` — uppercase first word of fullName + `_` + last 4 digits of phoneNumber; collision handling appends `_01`, `_02`, etc.
    - Implement `ensureReferralCode(memberId: string): Promise<string | null>` — no-op if code already set; defers if fullName or phoneNumber missing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]\* 2.2 Write property test for referral code format invariant (Property 1)
    - Use `fast-check` to generate arbitrary fullName and phoneNumber strings
    - Assert generated code matches `^[A-Z]+_\d{4}(_\d{2})?$`
    - **Property 1: Referral Code Format Invariant**
    - **Validates: Requirements 1.1, 1.3**

  - [ ]\* 2.3 Write property test for referral code immutability (Property 2)
    - Assert that calling `ensureReferralCode` on a member that already has a code returns the same code unchanged
    - **Property 2: Referral Code Immutability**
    - **Validates: Requirements 1.4**

  - [x] 2.4 Implement `creditCommission(contributionId: string): Promise<void>` in `ReferralService`
    - Look up contribution; skip if no `referredBy` on member or `firstPaymentCleared` is already true
    - Calculate `Math.floor(amount * 0.1)`, increment champion's `commissionsBalance`, set `firstPaymentCleared = true`, create `CommissionLedger` entry — all in a single Prisma transaction
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 12.1, 12.2_

  - [ ]\* 2.5 Write property test for commission calculation accuracy (Property 3)
    - Use `fast-check` to generate arbitrary integer amounts (0–100000)
    - Assert `Math.floor(amount * 0.1)` equals the credited commission
    - **Property 3: Commission Calculation Accuracy**
    - **Validates: Requirements 3.1, 12.1**

  - [ ]\* 2.6 Write property test for first-payment flag idempotency (Property 5)
    - Assert that calling `creditCommission` a second time for the same referred user does not change the champion's `commissionsBalance`
    - **Property 5: First Payment Flag Idempotency**
    - **Validates: Requirements 3.6**

  - [x] 2.7 Implement `updateActiveReferralCount(championReferralCode: string): Promise<void>` and `recalculateActiveReferralCount(championReferralCode: string): Promise<number>` in `ReferralService`
    - `recalculateActiveReferralCount`: COUNT query on Member where `referredBy = code AND firstPaymentCleared = true AND subscription.isActive = true`
    - `updateActiveReferralCount`: call recalculate, update `activeReferralsCount` on champion, then call `evaluateGoldMemberStatus`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]\* 2.8 Write property test for active referral count consistency (Property 6)
    - Assert stored `activeReferralsCount` equals the live database COUNT for any champion
    - **Property 6: Active Referral Count Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 2.9 Implement `evaluateGoldMemberStatus(championId: string): Promise<boolean>` and `processGoldMemberWaiver(championId: string): Promise<void>` in `ReferralService`
    - `evaluateGoldMemberStatus`: set `isGoldMember = (activeReferralsCount >= 25)` on champion
    - `processGoldMemberWaiver`: create a `WAIVED` Contribution record with `waivedReason: "gold_champion_benefit"` in metadata when `isGoldMember` transitions to true
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]\* 2.10 Write property test for Gold Member status derivation (Property 7)
    - Use `fast-check` to generate arbitrary `activeReferralsCount` values (0–100)
    - Assert `isGoldMember === (activeReferralsCount >= 25)`
    - **Property 7: Gold Member Status Derivation**
    - **Validates: Requirements 4.4, 5.1, 5.2**

  - [x] 2.11 Implement `getChampionStats`, `getChampionReferrals`, and `getLeaderboard` query methods in `ReferralService`
    - `getChampionStats`: return `ChampionStats` shape (referralCode, inviteLink, totalReferrals, activeReferrals, commissionsEarned, commissionsWithdrawn, commissionsBalance, isGoldMember)
    - `getChampionReferrals`: paginated list of referred members (name/masked phone, registrationDate, firstPaymentCleared)
    - `getLeaderboard(limit = 50)`: ORDER BY `activeReferralsCount DESC` LIMIT 50, return only privacy-safe fields
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 11.1, 11.2, 11.3_

  - [ ]\* 2.12 Write property test for leaderboard ordering and privacy (Properties 9 & 10)
    - Assert entries are sorted descending by `activeReferralsCount` and count ≤ 50
    - Assert no entry contains `phoneNumber`, `email`, or `commissionsBalance`
    - **Property 9: Leaderboard Ordering**
    - **Property 10: Leaderboard Privacy**
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [x] 2.13 Create `menodao-backend/src/referrals/referral.module.ts` and wire `ReferralService` with `PrismaModule`
    - Export `ReferralService` so it can be imported by `PaymentModule` and `AdminModule`
    - _Requirements: 10.2, 10.3_

- [ ] 3. Checkpoint — Ensure all backend unit and property tests pass
  - Run `npx jest --testPathPattern=referral --run` in `menodao-backend/`; ask the user if any tests fail.

- [x] 4. Phase 3 — PaymentService Integration Hooks
  - [x] 4.1 Import `ReferralModule` into `PaymentModule` in `menodao-backend/src/payments/payment.module.ts`
    - Add `ReferralModule` to the `imports` array; inject `ReferralService` into `PaymentService` constructor
    - _Requirements: 10.2_

  - [x] 4.2 Add fire-and-forget commission hook in `PaymentService.processCallback()` after the contribution is marked COMPLETED
    - Wrap in `try { await this.referralService.creditCommission(contribution.id); } catch (e) { this.logger.error(...); }` — never rethrow
    - Place the hook immediately after the `await this.prisma.contribution.update(...)` COMPLETED update, before the upgrade/subscription branch
    - _Requirements: 3.1, 10.2, 10.4_

  - [x] 4.3 Add fire-and-forget active-referral-count hook in `PaymentService.processCallback()` after subscription activation
    - After `await this.prisma.subscription.update({ data: { isActive: true } })`, add: `try { const member = await this.prisma.member.findUnique({ where: { id: contribution.memberId }, select: { referredBy: true } }); if (member?.referredBy) await this.referralService.updateActiveReferralCount(member.referredBy); } catch (e) { this.logger.error(...); }`
    - _Requirements: 4.1, 10.3, 10.4_

  - [x] 4.4 Hook `ensureReferralCode` into member creation in `menodao-backend/src/auth/auth.service.ts` (or wherever `prisma.member.create` is called)
    - After member is created, call `referralService.ensureReferralCode(member.id)` in a fire-and-forget try-catch
    - _Requirements: 1.1, 1.2_

- [x] 5. Phase 4 — API Endpoints
  - [x] 5.1 Create `menodao-backend/src/referrals/referral.controller.ts` with member endpoints
    - `GET /referrals/my-stats` — guarded by existing member JWT auth guard; returns `ChampionStats`
    - `GET /referrals/my-referrals?page=&limit=` — paginated referral list
    - `GET /referrals/withdrawals` — withdrawal history for authenticated champion
    - _Requirements: 7.1–7.8, 9.1_

  - [x] 5.2 Add withdrawal endpoints to `ReferralController`
    - `POST /referrals/withdraw` — body `{ amount: number }`; validate amount ≥ 200 and ≤ commissionsBalance; create `WithdrawalRecord`; if `commissionsWithdrawn === 0` set status `PENDING_ADMIN_APPROVAL`, else auto-disburse via `processWithdrawal`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.8_

  - [ ]\* 5.3 Write property test for withdrawal amount validation (Property 11)
    - Assert that any request where `amount > commissionsBalance` returns an error and no `WithdrawalRecord` is created
    - **Property 11: Withdrawal Amount Validation**
    - **Validates: Requirements 9.4, 9.5**

  - [x] 5.4 Create `menodao-backend/src/champions/champions.controller.ts` with public leaderboard endpoint
    - `GET /champions/leaderboard` — no auth required; implement 5-minute in-memory cache (store result + timestamp, re-query if stale)
    - _Requirements: 11.1, 11.2, 11.3, 11.7_

  - [x] 5.5 Add admin referral endpoints to `AdminController` in `menodao-backend/src/admin/admin.controller.ts`
    - `GET /admin/members/:id/referrals` — guarded by `AdminAuthGuard`; returns referral summary + list of referred members
    - `GET /admin/withdrawals?status=` — list withdrawal records filterable by status
    - `POST /admin/withdrawals/:id/approve` — approve first-payout; trigger `processWithdrawal`
    - `POST /admin/withdrawals/:id/reject` — reject with reason; send SMS via `SmsService`
    - _Requirements: 8.1, 8.2, 8.3, 9.7, 9.11, 9.12_

  - [x] 5.6 Implement `requestWithdrawal`, `approveWithdrawal`, `rejectWithdrawal`, and `processWithdrawal` in `ReferralService`
    - `processWithdrawal`: call `sasapay.sendMoney(champion.phoneNumber, amount, ref, description)`; on success set status COMPLETED, decrement `commissionsBalance`, increment `commissionsWithdrawn`; on failure set status FAILED, log error, preserve balance
    - _Requirements: 9.7, 9.8, 9.9, 9.10, 9.12_

- [ ] 6. Checkpoint — Ensure all backend tests pass and API endpoints respond correctly
  - Run `npx jest --run` in `menodao-backend/`; ask the user if any tests fail.

- [x] 7. Phase 5 — Withdrawal Flow (SasaPay integration)
  - [x] 7.1 Inject `SasaPayService` and `SmsService` into `ReferralService` via constructor
    - Follow the same pattern as `DisbursalService` — import `SasaPayModule` and `SmsModule` in `ReferralModule`
    - _Requirements: 9.7, 9.12_

  - [x] 7.2 Implement automated disbursement in `processWithdrawal` using `SasaPayService.sendMoney`
    - Generate a unique transaction reference `CHAMP_WITHDRAW_${Date.now()}_${withdrawalId.slice(0,8)}`
    - Store `sasaPayRequestId` on the `WithdrawalRecord`; update status to COMPLETED on success
    - On failure: set status FAILED, store `errorMessage`, do NOT touch `commissionsBalance`
    - _Requirements: 9.7, 9.8, 9.9, 9.10_

  - [x] 7.3 Implement SMS notification in `rejectWithdrawal` using `SmsService.sendSms`
    - Message: `"Dear {firstName}, your MenoDAO commission withdrawal of KES {amount} has been rejected. Reason: {reason}. Your balance remains KES {balance}. Contact support for assistance."`
    - Wrap in try-catch; SMS failure must not fail the rejection operation
    - _Requirements: 9.12_

- [x] 8. Phase 6 — Frontend: Champion Dashboard
  - [x] 8.1 Add champion API methods to `menodao-frontend/src/lib/api.ts`
    - `getChampionStats(): Promise<ChampionStats>`
    - `getChampionReferrals(page, limit): Promise<PaginatedReferrals>`
    - `requestWithdrawal(amount: number): Promise<WithdrawalResponse>`
    - `getWithdrawalHistory(): Promise<WithdrawalRecord[]>`
    - _Requirements: 7.1–7.8, 9.1–9.5_

  - [x] 8.2 Create `menodao-frontend/src/app/(dashboard)/dashboard/champion/page.tsx` — Champion Dashboard page
    - Use `useQuery` to fetch champion stats; show loading skeleton while loading
    - Display referral code, invite link with "Copy Link" button (navigator.clipboard), and "Share" button (Web Share API with fallback)
    - Display stats cards: total referrals, active referrals, commissions earned, commissions balance, commissions withdrawn
    - Display Gold Champion badge and waiver summary when `isGoldMember = true`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.9, 7.11, 5.5, 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 8.3 Write unit test for Champion Dashboard withdraw button visibility (Property 12)
    - Render dashboard with `commissionsBalance = 150` → assert "Withdraw" button is absent
    - Render dashboard with `commissionsBalance = 200` → assert "Withdraw" button is present
    - **Property 12: Withdraw Button Visibility**
    - **Validates: Requirements 9.1, 9.2**

  - [x] 8.4 Add paginated referrals list to Champion Dashboard
    - Table/list showing: name (or masked phone), registration date, first payment cleared status
    - Pagination controls (previous/next); fetch via `getChampionReferrals(page, 10)`
    - _Requirements: 7.8_

  - [x] 8.5 Add withdrawal request form to Champion Dashboard
    - Show current balance; show "Withdraw" button only when `commissionsBalance >= 200`
    - When balance < 200, show: "Minimum withdrawal is KES 200. Current balance: KES {balance}."
    - Form: amount input (max = commissionsBalance); submit calls `requestWithdrawal`; show success/error toast
    - Display withdrawal history list below the form
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 8.6 Add "Champion" navigation item to the existing dashboard sidebar
    - Locate the sidebar component (e.g., `menodao-frontend/src/app/(dashboard)/components/` or similar); add a new nav item linking to `/dashboard/champion`
    - Use a trophy or star icon consistent with existing nav icons
    - _Requirements: 7.10, 7.11_

- [x] 9. Phase 7 — Frontend: Leaderboard
  - [x] 9.1 Create `menodao-frontend/src/app/leaderboard/page.tsx` — public leaderboard page
    - Fetch from `GET /champions/leaderboard` (no auth); show loading skeleton while loading
    - Table with columns: Rank, First Name, Referral Code, Active Referrals, Total Referrals, Member Since, Total Earned
    - Style for mobile and desktop using existing Tailwind patterns
    - _Requirements: 11.4, 11.5, 11.6_

- [x] 10. Phase 8 — Frontend: Sign-Up ref param integration
  - [x] 10.1 Update `menodao-frontend/src/app/sign-up/page.tsx` to read `ref` query parameter
    - Use `useSearchParams()` to read `ref`; if present, store in component state as `referralCode`
    - Pass `referralCode` to the `api.requestOtp` call (or store in `sessionStorage` alongside other signup data) so it is sent to the backend on member creation
    - _Requirements: 6.5, 6.6, 6.7_

  - [x] 10.2 Update the backend member creation endpoint to accept and store `referredBy`
    - In the auth/member creation handler, read `referralCode` from the request body; validate it exists in the Member table; if valid set `referredBy = referralCode`, else ignore
    - _Requirements: 6.6, 6.7_

- [ ] 11. Phase 9 — Frontend: Admin Panel additions
  - [x] 11.1 Add referral fields to the admin member detail view in `menodao-frontend/src/app/admin/components/MemberManagement.tsx`
    - Display `referralCode`, `referredBy`, `firstPaymentCleared`, `commissionsBalance`, `commissionsWithdrawn`, `activeReferralsCount`, `isGoldMember` in the member detail panel
    - _Requirements: 8.1, 8.3_

  - [x] 11.2 Create `menodao-frontend/src/app/admin/components/WithdrawalManagement.tsx`
    - Fetch withdrawal records from `GET /admin/withdrawals?status=`; filter tabs: All, Pending Approval, Approved, Failed
    - For each PENDING_ADMIN_APPROVAL record: show "Approve" and "Reject" buttons; rejection requires a reason input
    - Call `POST /admin/withdrawals/:id/approve` or `POST /admin/withdrawals/:id/reject` accordingly
    - _Requirements: 9.11, 9.12_

  - [x] 11.3 Add `WithdrawalManagement` component to the admin panel tab navigation
    - Add a "Withdrawals" tab to the existing admin panel (follow the same pattern as `DisbursalManagement` tab)
    - _Requirements: 9.11_

- [ ] 12. Checkpoint — Ensure all tests pass and full referral flow works end-to-end
  - Run `npx jest --run` in `menodao-backend/`; run `npx jest --run` in `menodao-frontend/`; ask the user if any tests fail.

- [ ] 13. Phase 10 — Property-Based Tests
  - [ ]\* 13.1 Write property test for commission crediting correctness (Property 4)
    - For any champion with a referred user making their first COMPLETED payment, assert `commissionsBalance` increases by exactly `Math.floor(amount * 0.1)`
    - **Property 4: Commission Crediting Correctness**
    - **Validates: Requirements 3.2**

  - [ ]\* 13.2 Write property test for invite link format (Property 8)
    - For any referral code, assert generated invite link equals `{BASE_URL}/sign-up?ref={referralCode}`
    - **Property 8: Invite Link Format**
    - **Validates: Requirements 6.1**

- [x] 14. Phase 11 — Deployment Prep
  - [x] 14.1 Add feature flag environment variables to `menodao-backend/.env` and document them
    - `REFERRAL_COMMISSION_ENABLED=true` — set to `false` to disable commission crediting without code changes
    - `REFERRAL_WITHDRAWALS_ENABLED=true` — set to `false` to disable new withdrawal requests
    - Read these flags in `ReferralService.creditCommission` and `ReferralService.requestWithdrawal` respectively
    - _Requirements: 10.4_

  - [x] 14.2 Verify the Prisma migration is safe to run on production
    - Confirm migration SQL contains only `ALTER TABLE ... ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX` statements
    - Confirm all new columns have `DEFAULT` values so existing rows are not affected
    - _Requirements: 10.1_

  - [x] 14.3 Add structured logging for all referral operations in `ReferralService`
    - Log: commission credited (championId, amount, contributionId), active referral count updated (championId, old, new), Gold Member status changed (championId, isGoldMember), withdrawal requested/approved/rejected/completed/failed
    - _Requirements: 10.4_

- [x] 15. Final Checkpoint — Ensure all tests pass
  - Run `npx jest --run` in both `menodao-backend/` and `menodao-frontend/`; ask the user if any tests fail.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All referral hooks in `PaymentService` use fire-and-forget (try-catch, never rethrow) — payment callbacks are never blocked
- All Prisma migrations are additive only — no existing columns are dropped or altered
- The leaderboard uses a simple in-memory cache (timestamp + data); Redis can replace it later
- `commissionsBalance` and `commissionsWithdrawn` are stored in whole KES (integers)
- Referral code format: `FIRSTNAME_XXXX` where XXXX = last 4 digits of phone number
