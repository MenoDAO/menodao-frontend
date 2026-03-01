# Member Treatment History - Design Document

## Architecture Overview

This feature adds a member-facing treatment history viewer by:

1. Adding a new endpoint to the members controller
2. Creating a service method that retrieves visit history for the authenticated member
3. Building a frontend page in the member dashboard
4. Adding an API client method for the new endpoint

## Backend Design

### 1. API Endpoint

**Route**: `GET /members/history`

**Authentication**: JwtAuthGuard (member authentication)

**Query Parameters**:

- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Number of visits per page

**Response Structure**:

```typescript
{
  visits: [
    {
      id: string;
      date: Date;
      status: VisitStatus;
      totalCost: number;
      clinic: string;
      treatedBy: string;
      procedures: [
        {
          name: string;
          cost: number;
          addedAt: Date;
        }
      ];
      clinicalData: {
        chiefComplaint: string | null;
        medicalHistory: string | null;
        vitals: any | null;
        clinicalNotes: string | null;
      };
      questionnaire: QuestionnaireData | null;
    }
  ];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### 2. Service Method

**Location**: `members.service.ts`

**Method**: `getMemberHistory(memberId: string, page: number, limit: number)`

**Implementation Strategy**:

- Query visits table filtered by memberId
- Include related data: procedures, staff, clinic, questionnaire
- Order by checkedInAt DESC (most recent first)
- Apply pagination
- No privacy masking (member viewing own data)
- Return full clinical details and questionnaire data

**Database Query**:

```typescript
const visits = await this.prisma.visit.findMany({
  where: { memberId },
  include: {
    procedures: {
      include: {
        procedure: true,
      },
    },
    staff: {
      select: {
        fullName: true,
        clinic: {
          select: {
            name: true,
          },
        },
      },
    },
    questionnaire: true,
  },
  orderBy: { checkedInAt: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});
```

### 3. Controller Method

**Location**: `members.controller.ts`

**Method**: `getHistory(@Request() req, @Query() page, @Query() limit)`

**Decorators**:

- `@Get('history')`
- `@ApiOperation({ summary: 'Get member treatment history' })`
- `@ApiQuery({ name: 'page', required: false, type: Number })`
- `@ApiQuery({ name: 'limit', required: false, type: Number })`

## Frontend Design

### 1. Page Location

**Path**: `src/app/(dashboard)/dashboard/history/page.tsx`

**Route**: `/dashboard/history`

### 2. Component Structure

```
HistoryPage
├── Header (title + description)
├── VisitsList
│   ├── VisitCard (for each visit)
│   │   ├── VisitHeader (date, clinic, cost)
│   │   ├── ProceduresList
│   │   ├── ClinicalDetails (collapsible)
│   │   └── QuestionnaireDetails (collapsible)
│   └── Pagination
└── EmptyState (when no visits)
```

### 3. API Client Method

**Location**: `lib/api.ts`

**Method**:

```typescript
async getMemberHistory(page = 1, limit = 20) {
  return this.request<MemberHistoryResponse>(
    `/members/history?page=${page}&limit=${limit}`,
  );
}
```

**Type Definitions**:

```typescript
export interface MemberHistoryResponse {
  visits: MemberVisit[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MemberVisit {
  id: string;
  date: Date;
  status: string;
  totalCost: number;
  clinic: string;
  treatedBy: string;
  procedures: {
    name: string;
    cost: number;
    addedAt: Date;
  }[];
  clinicalData: {
    chiefComplaint: string | null;
    medicalHistory: string | null;
    vitals: any | null;
    clinicalNotes: string | null;
  };
  questionnaire: QuestionnaireData | null;
}
```

### 4. UI Design

**Visual Style**:

- Match existing dashboard pages (claims, transactions)
- Use card-based layout for each visit
- Color-coded status badges
- Collapsible sections for detailed information
- Responsive grid layout

**Key Elements**:

- Visit date prominently displayed
- Clinic name and location
- Total cost with currency formatting
- Procedure list with individual costs
- Expandable clinical details section
- Expandable questionnaire section (if available)
- Pagination controls at bottom

**Empty State**:

- Friendly icon (calendar or medical)
- Message: "No treatment history yet"
- Subtext: "Your visits to MenoDAO clinics will appear here"

### 5. Navigation Integration

**Location**: Dashboard layout navigation

**Add menu item**:

```typescript
{
  name: 'Treatment History',
  href: '/dashboard/history',
  icon: ClipboardList, // or similar icon
}
```

## Data Flow

1. User navigates to `/dashboard/history`
2. Page component mounts, calls `api.getMemberHistory()`
3. API client makes authenticated GET request to `/members/history`
4. Backend validates JWT, extracts memberId
5. Service queries database for member's visits
6. Response formatted and returned to frontend
7. Frontend renders visit cards with all details
8. User can paginate through history

## Security Considerations

1. **Authentication**: JwtAuthGuard ensures only authenticated members access endpoint
2. **Authorization**: Service filters by authenticated member's ID only
3. **Data Isolation**: No cross-member data leakage possible
4. **Privacy**: Full data shown (no masking) since member viewing own records
5. **Input Validation**: Page and limit parameters validated and sanitized

## Error Handling

### Backend Errors

- 401 Unauthorized: Invalid or missing JWT token
- 404 Not Found: Member not found (shouldn't happen with valid JWT)
- 500 Internal Server Error: Database or service errors

### Frontend Error Handling

- Display error message in UI
- Retry button for transient failures
- Fallback to empty state on persistent errors
- Log errors for debugging

## Performance Considerations

1. **Pagination**: Default 20 visits per page prevents large payloads
2. **Database Indexing**: Ensure index on `Visit.memberId` and `Visit.checkedInAt`
3. **Query Optimization**: Use Prisma's `include` efficiently
4. **Caching**: Consider client-side caching for recently viewed pages
5. **Lazy Loading**: Load questionnaire details only when expanded

## Testing Strategy

### Backend Tests

1. Unit test `getMemberHistory` service method
2. Integration test `/members/history` endpoint
3. Test pagination logic
4. Test authentication/authorization
5. Test with various data scenarios (no visits, many visits, with/without questionnaires)

### Frontend Tests

1. Component rendering tests
2. API integration tests (mocked)
3. Pagination interaction tests
4. Empty state rendering
5. Error state handling
6. Responsive layout tests

## Rollout Plan

1. **Phase 1**: Backend implementation
   - Add service method
   - Add controller endpoint
   - Write backend tests
   - Deploy to dev environment

2. **Phase 2**: Frontend implementation
   - Add API client method
   - Create history page component
   - Add navigation link
   - Write frontend tests
   - Deploy to dev environment

3. **Phase 3**: Testing & QA
   - Manual testing on dev
   - Test with real member accounts
   - Verify pagination
   - Check mobile responsiveness

4. **Phase 4**: Production deployment
   - Deploy backend changes
   - Deploy frontend changes
   - Monitor for errors
   - Gather user feedback

## Future Enhancements

1. Export history as PDF
2. Filter by date range
3. Search within history
4. Download medical records
5. Share history with external providers
6. Trend analysis and visualizations
7. Reminders for follow-up visits

## Correctness Properties

### Property 1: Member Data Isolation

**Validates: Requirements AC-7**

For any authenticated member M with ID `memberId`, calling `GET /members/history` must return only visits where `visit.memberId === memberId`. No visits from other members should ever be included in the response.

**Test Strategy**: Property-based test with multiple member IDs, verify response contains only matching visits.

### Property 2: Chronological Ordering

**Validates: Requirements AC-3**

For any member's history response, visits must be ordered by `checkedInAt` in descending order (most recent first). For any two consecutive visits V1 and V2 in the response array, `V1.checkedInAt >= V2.checkedInAt` must be true.

**Test Strategy**: Property-based test generating random visit dates, verify ordering invariant.

### Property 3: Complete Visit Data

**Validates: Requirements AC-2**

For each visit in the response, all required fields must be present and non-null: `id`, `date`, `status`, `totalCost`, `clinic`, `treatedBy`, `procedures` array. Optional fields (`clinicalData`, `questionnaire`) may be null but must be present in the structure.

**Test Strategy**: Property-based test with schema validation, ensure all required fields exist.

### Property 4: Pagination Consistency

**Validates: Requirements AC-6**

For any valid page number P and limit L:

- Response must contain at most L visits
- `meta.total` must equal the total count of member's visits
- `meta.totalPages` must equal `ceil(meta.total / L)`
- Requesting all pages and concatenating results must yield the complete visit set with no duplicates or omissions

**Test Strategy**: Property-based test with various page/limit combinations, verify pagination math and completeness.

### Property 5: Authentication Required

**Validates: Requirements AC-7**

Any request to `GET /members/history` without a valid JWT token must return 401 Unauthorized. Any request with a valid token must return only that token's member's data.

**Test Strategy**: Unit test with missing token, invalid token, and valid token scenarios.

### Property 6: Cost Accuracy

**Validates: Requirements AC-5**

For each visit, `totalCost` must equal the sum of all procedure costs in that visit. For any visit V, `V.totalCost === sum(V.procedures.map(p => p.cost))` must be true.

**Test Strategy**: Property-based test generating visits with random procedures, verify cost calculation.
