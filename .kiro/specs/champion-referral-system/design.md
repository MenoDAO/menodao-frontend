# Champion Referral System — Technical Design Document

## Overview

The Champion Referral System transforms every MenoDAO member into an ambassador who can invite others to join the platform. Each member receives a unique referral code, earns 10% cash commissions on referred users' first subscription payments, and can unlock a free Gold-tier monthly premium waiver by maintaining 25+ active paying referrals.

This design integrates the referral system into the existing NestJS/Prisma backend and Next.js frontend without breaking any live functionality. All new logic is additive and hooks into existing payment and subscription flows using a fire-and-forget pattern to ensure resilience.

## Architecture

### System Components

1. **ReferralService** (NestJS): Core business logic for referral code generation, commission calculation, and Gold Member status evaluation
2. **ReferralModule** (NestJS): Module wiring and dependency injection
3. **CommissionLedger** (Prisma model): Audit trail for all commission credits
4. **WithdrawalRecord** (Prisma model): Withdrawal requests and disbursement tracking
5. **PaymentService integration hooks**: Non-breaking hooks in `processCallback` for commission crediting
6. **Champion Dashboard** (Next.js): Member-facing UI at `/dashboard/champion`
7. **Leaderboard** (Next.js): Public page at `/leaderboard`
8. **Admin endpoints**: Referral visibility and withdrawal management

### Data Flow

```
Member Sign-Up → Referral Code Generation → Store in Member.referralCode
    ↓
Referred User Sign-Up (with ref param) → Store in Member.referredBy
    ↓
Referred User First Payment (COMPLETED) → Commission Crediting
    ↓
Champion.commissionsBalance += floor(amount * 0.1)
    ↓
CommissionLedger entry created
    ↓
Active Referral Count Update → Gold Member Status Evaluation
    ↓
If activeReferralsCount >= 25 → isGoldMember = true → Monthly Premium Waived
```

## Components and Interfaces

### Database Schema Changes

#### Member Model Extensions

```prisma
model Member {
  // ... existing fields ...

  // Referral system fields
  referralCode          String?  @unique
  referredBy            String?  // Referral code of the champion who referred this member
  firstPaymentCleared   Boolean  @default(false)
  commissionsBalance    Int      @default(0) // KES, whole shillings
  commissionsWithdrawn  Int      @default(0) // KES, total withdrawn to date
  activeReferralsCount  Int      @default(0)
  isGoldMember          Boolean  @default(false)

  // Relations
  commissionLedger      CommissionLedger[]
  withdrawalRecords     WithdrawalRecord[]

  @@index([referralCode])
  @@index([referredBy])
}
```

#### New Models

```prisma
model CommissionLedger {
  id              String   @id @default(uuid())
  championId      String
  referredUserId  String
  contributionId  String
  amount          Int      // Commission amount in KES
  tier            PackageTier // Tier of the referred user at time of commission
  createdAt       DateTime @default(now())

  champion        Member   @relation(fields: [championId], references: [id])

  @@index([championId])
  @@index([createdAt])
}

model WithdrawalRecord {
  id              String            @id @default(uuid())
  championId      String
  amount          Int               // Withdrawal amount in KES
  status          WithdrawalStatus  @default(PENDING)
  sasaPayRequestId String?
  mpesaReceiptNumber String?
  errorMessage    String?
  rejectionReason String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  approvedAt      DateTime?
  completedAt     DateTime?

  champion        Member            @relation(fields: [championId], references: [id])

  @@index([championId])
  @@index([status])
  @@index([createdAt])
}

enum WithdrawalStatus {
  PENDING
  PENDING_ADMIN_APPROVAL
  APPROVED
  REJECTED
  FAILED
  COMPLETED
}
```

### ReferralService Interface

```typescript
@Injectable()
export class ReferralService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger,
  ) {}

  // Referral code generation
  async generateReferralCode(
    fullName: string,
    phoneNumber: string,
  ): Promise<string>;
  async ensureReferralCode(memberId: string): Promise<string>;

  // Commission crediting (called from PaymentService.processCallback)
  async creditCommission(contributionId: string): Promise<void>;

  // Active referral count maintenance
  async updateActiveReferralCount(championReferralCode: string): Promise<void>;
  async recalculateActiveReferralCount(
    championReferralCode: string,
  ): Promise<number>;

  // Gold Member status evaluation
  async evaluateGoldMemberStatus(championId: string): Promise<boolean>;
  async processGoldMemberWaiver(championId: string): Promise<void>;

  // Champion dashboard data
  async getChampionStats(memberId: string): Promise<ChampionStats>;
  async getChampionReferrals(
    memberId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedReferrals>;

  // Leaderboard
  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]>;

  // Withdrawal management
  async requestWithdrawal(
    championId: string,
    amount: number,
  ): Promise<WithdrawalRecord>;
  async approveWithdrawal(withdrawalId: string, adminId: string): Promise<void>;
  async rejectWithdrawal(
    withdrawalId: string,
    adminId: string,
    reason: string,
  ): Promise<void>;
  async processWithdrawal(withdrawalId: string): Promise<void>;
}
```

### API Endpoints

#### Member Endpoints

```
GET    /referrals/my-stats              → Get champion stats (code, balance, referrals count)
GET    /referrals/my-referrals          → Get paginated list of referrals
POST   /referrals/withdraw              → Request commission withdrawal
GET    /referrals/withdrawals           → Get withdrawal history
```

#### Public Endpoints

```
GET    /champions/leaderboard           → Get top 50 champions (public, cached 5min)
```

#### Admin Endpoints

```
GET    /admin/members/:id/referrals     → Get member's referral summary
GET    /admin/withdrawals               → List all withdrawal requests (filterable by status)
POST   /admin/withdrawals/:id/approve   → Approve first-payout withdrawal
POST   /admin/withdrawals/:id/reject    → Reject withdrawal with reason
```

## Data Models

### ChampionStats

```typescript
interface ChampionStats {
  referralCode: string;
  inviteLink: string;
  totalReferrals: number;
  activeReferrals: number;
  commissionsEarned: number;
  commissionsWithdrawn: number;
  commissionsBalance: number;
  isGoldMember: boolean;
  goldMemberBenefits?: {
    monthlyWaiverAmount: number;
    nextWaiverDate: string;
  };
}
```

### LeaderboardEntry

```typescript
interface LeaderboardEntry {
  rank: number;
  firstName: string;
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionsEarned: number;
  memberSince: string;
}
```

### WithdrawalRequest

```typescript
interface WithdrawalRequest {
  amount: number;
}

interface WithdrawalResponse {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  message: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Referral Code Format Invariant

_For any_ member with a fullName and phoneNumber, the generated referralCode SHALL match the pattern `^[A-Z]+_\d{4}(_\d{2})?$` (uppercase first name, underscore, last 4 digits of phone, optional 2-digit suffix).

**Validates: Requirements 1.1, 1.3**

### Property 2: Referral Code Immutability

_For any_ member with a non-null referralCode, updating the member's fullName or phoneNumber SHALL NOT change the referralCode value.

**Validates: Requirements 1.4**

### Property 3: Commission Calculation Accuracy

_For any_ contribution amount, the calculated commission SHALL equal `Math.floor(amount * 0.1)` KES.

**Validates: Requirements 3.1, 12.1**

### Property 4: Commission Crediting Correctness

_For any_ champion with a referred user making their first COMPLETED payment, the champion's commissionsBalance SHALL increase by exactly `Math.floor(contributionAmount * 0.1)` KES.

**Validates: Requirements 3.2**

### Property 5: First Payment Flag Idempotency

_For any_ referred user with `firstPaymentCleared = true`, completing additional payments SHALL NOT change the champion's commissionsBalance.

**Validates: Requirements 3.6**

### Property 6: Active Referral Count Consistency

_For any_ champion, the stored `activeReferralsCount` SHALL equal the database count of members where `referredBy = champion.referralCode` AND `firstPaymentCleared = true` AND `subscription.isActive = true`.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: Gold Member Status Derivation

_For any_ champion, `isGoldMember` SHALL equal `(activeReferralsCount >= 25)`.

**Validates: Requirements 4.4, 5.1, 5.2**

### Property 8: Invite Link Format

_For any_ referral code, the generated invite link SHALL equal `{BASE_URL}/sign-up?ref={referralCode}`.

**Validates: Requirements 6.1**

### Property 9: Leaderboard Ordering

_For any_ leaderboard response, entries SHALL be sorted in descending order by `activeReferralsCount` and the result count SHALL NOT exceed 50.

**Validates: Requirements 11.1**

### Property 10: Leaderboard Privacy

_For any_ leaderboard entry, the response SHALL NOT contain `phoneNumber`, `email`, `commissionsBalance`, or any other PII fields beyond `firstName`.

**Validates: Requirements 11.2, 11.3**

### Property 11: Withdrawal Amount Validation

_For any_ withdrawal request where `amount > champion.commissionsBalance`, the system SHALL return an error and SHALL NOT create a withdrawal record.

**Validates: Requirements 9.4, 9.5**

### Property 12: Withdraw Button Visibility

_For any_ champion with `commissionsBalance < 200`, the Champion Dashboard SHALL NOT display the "Withdraw" button.

**Validates: Requirements 9.1, 9.2**

## Error Handling

### Referral Code Generation Errors

- **Missing fullName or phoneNumber**: Defer code generation until both fields are present (Requirement 1.5)
- **Collision (code already exists)**: Append 2-digit suffix `_01`, `_02`, etc. (Requirement 1.3)
- **Invalid input format**: Log error and return null, do not fail member creation

### Commission Crediting Errors

- **No referredBy value**: Skip commission crediting silently (Requirement 3.5)
- **firstPaymentCleared already true**: Skip commission crediting silently (Requirement 3.6)
- **Database transaction failure**: Log error, do NOT fail payment callback response (Requirement 10.4)
- **Champion not found**: Log error, skip commission crediting

### Withdrawal Errors

- **Amount exceeds balance**: Return 400 error with message "Withdrawal amount exceeds your available balance" (Requirement 9.5)
- **Balance below threshold**: Return 400 error with message "Minimum withdrawal amount is KES 200" (Requirement 9.1)
- **SasaPay disbursement failure**: Set withdrawal status to FAILED, log error, preserve balance (Requirement 9.10)
- **Admin rejection**: Set status to REJECTED, send SMS notification to champion (Requirement 9.12)

### Active Referral Count Errors

- **Subscription state inconsistency**: Recalculate from database count, log discrepancy
- **Negative count**: Floor at 0, log error (Requirement 4.2)

## Testing Strategy

### Unit Tests

- Referral code generation with various name/phone combinations
- Commission calculation with edge cases (0, 1, 999, 10000 KES)
- Gold Member status evaluation with boundary values (24, 25, 26 referrals)
- Withdrawal validation (below threshold, exceeds balance, exact balance)
- Invite link generation with special characters in referral codes

### Property-Based Tests

Each correctness property listed above will be implemented as a property-based test using `fast-check` (TypeScript) with minimum 100 iterations per property. Each test will be tagged with:

```typescript
// Feature: champion-referral-system, Property 1: Referral Code Format Invariant
```

### Integration Tests

- End-to-end referral flow: sign up with ref param → first payment → commission credited
- Gold Member waiver flow: reach 25 referrals → isGoldMember = true → waiver Contribution created
- Withdrawal flow: request → admin approval → SasaPay disbursement → balance updated
- Leaderboard caching: verify 5-minute cache TTL

### Example-Based Tests

- Referral code collision handling (create two members with same name+phone suffix)
- First-payout admin approval gate (first withdrawal requires approval, subsequent auto-disburse)
- Champion Dashboard rendering with mock data
- Leaderboard page rendering with mock data
- Admin referral visibility (member detail includes referral fields)

## Implementation Plan

### Phase 1: Database Schema & Migration

1. Create Prisma migration adding referral fields to Member model
2. Create CommissionLedger and WithdrawalRecord models
3. Add indexes on `Member.referralCode` and `Member.referredBy`
4. Run migration on dev environment, verify no data loss

### Phase 2: ReferralService Core Logic

1. Implement `generateReferralCode()` with collision handling
2. Implement `creditCommission()` with transaction safety
3. Implement `updateActiveReferralCount()` and `recalculateActiveReferralCount()`
4. Implement `evaluateGoldMemberStatus()` and `processGoldMemberWaiver()`
5. Write unit tests for all methods

### Phase 3: PaymentService Integration

1. Add fire-and-forget hook in `PaymentService.processCallback()` to call `ReferralService.creditCommission()`
2. Add fire-and-forget hook in subscription activation logic to call `ReferralService.updateActiveReferralCount()`
3. Wrap hooks in try-catch to prevent payment callback failures
4. Add logging for all referral operations

### Phase 4: API Endpoints

1. Create `ReferralController` with member endpoints (`/referrals/*`)
2. Create `ChampionsController` with public leaderboard endpoint (`/champions/leaderboard`)
3. Add admin endpoints to `AdminController` (`/admin/members/:id/referrals`, `/admin/withdrawals/*`)
4. Implement caching for leaderboard (5-minute TTL)

### Phase 5: Withdrawal Flow

1. Implement `requestWithdrawal()` with validation
2. Implement first-payout admin approval gate
3. Integrate SasaPay Disbursal API for automated withdrawals
4. Implement admin approval/rejection endpoints
5. Add SMS notifications for withdrawal status changes

### Phase 6: Frontend — Champion Dashboard

1. Create `/dashboard/champion` page component
2. Add "Champion" nav item to dashboard sidebar
3. Implement stats display (referral code, balance, referrals count)
4. Implement invite link with copy button and Web Share API
5. Implement referrals list with pagination
6. Implement withdrawal request form with validation

### Phase 7: Frontend — Leaderboard

1. Create `/leaderboard` public page
2. Implement leaderboard table with rank, name, referral code, stats
3. Add loading skeleton
4. Style for mobile and desktop

### Phase 8: Frontend — Sign-Up Integration

1. Update sign-up page to accept `ref` query parameter
2. Pre-fill referral code field when `ref` is present
3. Store `ref` value in `referredBy` field on member creation

### Phase 9: Admin Panel Integration

1. Add referral fields to admin member detail view
2. Implement withdrawal management UI (list, approve, reject)
3. Add referral stats to admin dashboard overview

### Phase 10: Testing & QA

1. Run all unit tests and property-based tests
2. Run integration tests on dev environment
3. Manual QA of full referral flow
4. Manual QA of withdrawal flow
5. Performance testing of leaderboard caching

### Phase 11: Deployment

1. Deploy database migration to production
2. Deploy backend changes (ReferralService, API endpoints)
3. Deploy frontend changes (Champion Dashboard, Leaderboard, sign-up integration)
4. Monitor logs for errors
5. Verify commission crediting on first real referral payment

## Non-Breaking Integration Strategy

### Fire-and-Forget Pattern

All referral operations are wrapped in try-catch blocks and logged. If any referral operation fails, the payment callback or subscription activation continues successfully. This ensures that referral system bugs do not break core payment flows.

```typescript
// In PaymentService.processCallback()
try {
  await this.referralService.creditCommission(contribution.id);
} catch (error) {
  this.logger.error(
    `Failed to credit commission for contribution ${contribution.id}: ${error.message}`,
  );
  // Continue processing payment callback
}
```

### Additive Schema Changes

All new database fields have default values and are nullable where appropriate. Existing queries and mutations are not modified. New queries are added to fetch referral data only when needed.

### Indexed Fields

All new query patterns use indexed fields (`Member.referralCode`, `Member.referredBy`) to avoid full-table scans.

### Backward Compatibility

- Members created before the referral system launch will have `referralCode = null` until they update their profile
- Existing members can still use the platform without a referral code
- All referral features are opt-in (members can ignore the Champion Dashboard)

## Security Considerations

### PII Protection

- Leaderboard exposes only `firstName`, `referralCode`, and aggregate stats (no phone, email, or full address)
- Admin endpoints require authentication and role-based access control
- Withdrawal records are only accessible to the champion and admins

### Fraud Prevention

- First-payout admin approval gate prevents automated withdrawal abuse
- Commission crediting is idempotent (only on first payment)
- Active referral count is recalculated from database to prevent manipulation
- Withdrawal amount validation prevents overdraft

### Rate Limiting

- Leaderboard endpoint is cached for 5 minutes to prevent abuse
- Withdrawal requests are rate-limited to 1 per hour per champion

## Performance Considerations

### Database Indexes

```sql
CREATE INDEX idx_member_referral_code ON "Member"("referralCode");
CREATE INDEX idx_member_referred_by ON "Member"("referredBy");
CREATE INDEX idx_commission_ledger_champion ON "CommissionLedger"("championId");
CREATE INDEX idx_withdrawal_record_champion ON "WithdrawalRecord"("championId");
CREATE INDEX idx_withdrawal_record_status ON "WithdrawalRecord"("status");
```

### Caching Strategy

- Leaderboard: 5-minute cache (Redis or in-memory)
- Champion stats: No caching (real-time balance updates)
- Referral list: Paginated, no caching

### Query Optimization

- Active referral count recalculation uses a single COUNT query with indexed fields
- Leaderboard query uses `ORDER BY activeReferralsCount DESC LIMIT 50` with index
- Commission ledger queries are paginated

## Monitoring & Observability

### Metrics

- Commission crediting success/failure rate
- Withdrawal request volume and approval rate
- Gold Member count over time
- Leaderboard cache hit rate
- Referral code generation collisions

### Logging

- All commission crediting operations (success and failure)
- All withdrawal requests and status changes
- All Gold Member status transitions
- All referral code generation collisions

### Alerts

- Commission crediting failure rate > 5%
- Withdrawal disbursement failure rate > 10%
- Active referral count discrepancy detected
- Leaderboard cache miss rate > 50%

## Rollback Plan

If critical issues are discovered post-deployment:

1. **Disable commission crediting**: Set feature flag `REFERRAL_COMMISSION_ENABLED=false` to stop crediting new commissions
2. **Disable withdrawals**: Set feature flag `REFERRAL_WITHDRAWALS_ENABLED=false` to prevent new withdrawal requests
3. **Hide Champion Dashboard**: Remove "Champion" nav item from frontend
4. **Revert database migration**: Run down migration to remove referral fields (only if no data has been written)

## Future Enhancements

- **Referral tiers**: Bonus commissions for high-performing champions
- **Referral contests**: Monthly leaderboard prizes
- **Social sharing analytics**: Track which channels drive the most referrals
- **Referral code customization**: Allow champions to choose custom codes
- **Multi-level referrals**: Earn commissions on referrals' referrals

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: Kiro AI Assistant  
**Status**: Ready for Implementation
