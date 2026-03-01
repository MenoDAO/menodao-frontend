# Member Treatment History - Implementation Tasks

## Backend Tasks

### Task 1: Add Service Method

- [x] 1.1 Add `getMemberHistory` method to `members.service.ts`
  - Query visits by memberId with all related data
  - Include procedures, staff, clinic, questionnaire
  - Order by checkedInAt DESC
  - Implement pagination logic
  - Return formatted response with meta information
- [ ] 1.2 Write unit tests for `getMemberHistory`
  - Test with no visits
  - Test with multiple visits
  - Test pagination logic
  - Test with/without questionnaire data
  - Test ordering (most recent first)

### Task 2: Add Controller Endpoint

- [x] 2.1 Add `getHistory` endpoint to `members.controller.ts`
  - Add GET route at `/members/history`
  - Use JwtAuthGuard for authentication
  - Add Swagger documentation
  - Add query parameter decorators for page and limit
  - Call service method with authenticated member ID
- [ ] 2.2 Write integration tests for endpoint
  - Test authentication requirement (401 without token)
  - Test successful response with valid token
  - Test pagination parameters
  - Test response structure matches design

### Task 3: Database Optimization

- [ ] 3.1 Verify database indexes
  - Check index on `Visit.memberId`
  - Check index on `Visit.checkedInAt`
  - Add indexes if missing
- [ ] 3.2 Test query performance
  - Test with large dataset (100+ visits)
  - Verify query execution time < 500ms

## Frontend Tasks

### Task 4: Add API Client Method

- [x] 4.1 Add `getMemberHistory` method to `api.ts`
  - Add method with page and limit parameters
  - Add TypeScript interfaces for response types
  - Handle authentication headers
  - Add error handling
- [ ] 4.2 Write tests for API client method
  - Test successful request
  - Test error handling
  - Test pagination parameters

### Task 5: Create History Page Component

- [x] 5.1 Create `src/app/(dashboard)/dashboard/history/page.tsx`
  - Set up page component structure
  - Add page metadata (title, description)
  - Implement data fetching with useEffect
  - Add loading state
  - Add error state
  - Add empty state (no visits)
- [ ] 5.2 Create VisitCard component
  - Display visit date and time
  - Display clinic name
  - Display total cost with formatting
  - Display attending doctor name
  - Display status badge
  - List procedures with individual costs
  - Add collapsible clinical details section
  - Add collapsible questionnaire section (if available)
- [ ] 5.3 Add pagination controls
  - Previous/Next buttons
  - Page number display
  - Disable buttons appropriately
  - Handle page changes
- [ ] 5.4 Style components
  - Match existing dashboard design
  - Ensure responsive layout
  - Add appropriate spacing and colors
  - Use consistent typography

### Task 6: Add Navigation Link

- [x] 6.1 Update dashboard layout navigation
  - Add "Treatment History" menu item
  - Add appropriate icon
  - Link to `/dashboard/history`
  - Ensure active state styling works

### Task 7: Frontend Testing

- [ ] 7.1 Write component tests
  - Test page rendering
  - Test loading state
  - Test error state
  - Test empty state
  - Test visit card rendering
  - Test pagination interactions
- [ ] 7.2 Write integration tests
  - Test full user flow
  - Test API integration (mocked)
  - Test navigation from dashboard

## Property-Based Testing Tasks

### Task 8: Backend Property Tests

- [ ] 8.1 Write property test for member data isolation (Property 1)
  - Generate multiple members with visits
  - Verify each member sees only their own visits
  - Test with various member ID combinations
- [ ] 8.2 Write property test for chronological ordering (Property 2)
  - Generate visits with random dates
  - Verify response is always ordered DESC by date
  - Test with various date ranges
- [ ] 8.3 Write property test for complete visit data (Property 3)
  - Generate visits with various data combinations
  - Verify all required fields are present
  - Validate response schema
- [ ] 8.4 Write property test for pagination consistency (Property 4)
  - Generate various page/limit combinations
  - Verify pagination math is correct
  - Verify no duplicates or omissions across pages
- [ ] 8.5 Write property test for cost accuracy (Property 6)
  - Generate visits with random procedures
  - Verify totalCost equals sum of procedure costs
  - Test with various procedure combinations

### Task 9: Frontend Property Tests

- [ ] 9.1 Write property test for UI rendering with various data
  - Generate random visit data
  - Verify component renders without errors
  - Verify all data is displayed correctly

## Integration & Deployment Tasks

### Task 10: Integration Testing

- [ ] 10.1 Test on dev environment
  - Deploy backend changes to dev
  - Deploy frontend changes to dev
  - Test with real member accounts
  - Verify pagination works correctly
  - Test on mobile devices
  - Test with various data scenarios

### Task 11: Documentation

- [ ] 11.1 Update API documentation
  - Document new endpoint in Swagger
  - Add example requests/responses
- [ ] 11.2 Update user documentation
  - Add feature to user guide (if exists)
  - Create help text for empty state

### Task 12: Production Deployment

- [ ] 12.1 Deploy backend to production
  - Run database migrations if needed
  - Deploy backend code
  - Verify endpoint is accessible
  - Monitor for errors
- [ ] 12.2 Deploy frontend to production
  - Build and deploy frontend
  - Verify page is accessible
  - Test with production data
  - Monitor for errors
- [ ] 12.3 Post-deployment verification
  - Test with real member accounts
  - Verify performance metrics
  - Check error logs
  - Gather initial user feedback

## Task Dependencies

- Task 2 depends on Task 1 (service must exist before controller)
- Task 4 depends on Task 2 (endpoint must exist before API client)
- Task 5 depends on Task 4 (API client must exist before page)
- Task 6 depends on Task 5 (page must exist before navigation)
- Task 10 depends on Tasks 1-7 (all implementation must be complete)
- Task 12 depends on Task 10 (integration testing must pass)

## Estimated Timeline

- Backend Tasks (1-3): 4-6 hours
- Frontend Tasks (4-7): 6-8 hours
- Property-Based Testing (8-9): 4-6 hours
- Integration & Deployment (10-12): 2-4 hours

**Total Estimated Time**: 16-24 hours

## Success Criteria

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All property-based tests passing
- [ ] Page loads in < 2 seconds
- [ ] No console errors
- [ ] Responsive on mobile and desktop
- [ ] Accessible via keyboard navigation
- [ ] Successfully deployed to production
- [ ] Zero critical bugs in first week
