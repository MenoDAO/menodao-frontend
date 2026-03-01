# Member Treatment History - Requirements

## Feature Overview

Enable members to view their own complete treatment history, including all past visits, procedures performed, costs covered, clinical details, and attending healthcare providers across all MenoDAO clinics.

## User Stories

### US-1: View Treatment History

As a member, I want to view my complete treatment history so that I can track my dental care journey and understand what procedures I've received.

### US-2: See Visit Details

As a member, I want to see detailed information about each visit including the date, clinic location, attending doctor, procedures performed, and costs covered by MenoDAO.

### US-3: Access Clinical Information

As a member, I want to access my clinical notes, chief complaints, medical history, and vitals from each visit so that I have a complete record of my healthcare.

### US-4: View Questionnaire Data

As a member, I want to see the comprehensive dental questionnaire (CDCQ-v1) data I provided during visits, including DMFT scores and oral health assessments.

### US-5: Track Costs and Coverage

As a member, I want to see how much each visit cost and what procedures were covered by my MenoDAO subscription.

## Acceptance Criteria

### AC-1: History Endpoint

- Backend provides GET `/members/history` endpoint
- Endpoint uses JwtAuthGuard for member authentication
- Returns only the authenticated member's own visit history
- No privacy masking needed (member viewing their own data)

### AC-2: Visit Data Structure

- Each visit includes:
  - Visit date and time
  - Clinic name and location
  - Attending doctor/intern name
  - Visit status (OPEN, DISCHARGED)
  - Total cost covered
  - List of procedures with individual costs
  - Clinical data (chief complaint, medical history, vitals, clinical notes)
  - Questionnaire data (if provided during visit)
  - Consent status

### AC-3: Chronological Ordering

- Visits are ordered from most recent to earliest
- Clear date/time display for each visit
- Easy to scan and navigate through history

### AC-4: Frontend Page

- Create member-facing page at `/dashboard/history`
- Accessible from member dashboard navigation
- Responsive design matching existing dashboard pages
- Clear visual hierarchy for visit information

### AC-5: No Data State

- Display friendly message when member has no visit history
- Encourage member to visit a MenoDAO clinic

### AC-6: Performance

- Paginated results (default 20 visits per page)
- Fast loading even with extensive history
- Efficient database queries

### AC-7: Privacy and Security

- Member can only access their own history
- JWT authentication required
- No cross-member data leakage

### AC-8: Integration

- Reuse existing visits service logic
- Consistent with staff-facing history viewer
- Use existing Prisma models and relationships

## Technical Constraints

1. Must use existing authentication system (JwtAuthGuard)
2. Must reuse visits service methods where possible
3. Must follow existing API patterns in members controller
4. Frontend must match existing dashboard design system
5. Must be backward compatible with existing data
6. No breaking changes to existing endpoints

## Out of Scope

- Ability to edit or delete visit history
- Ability to download/export history as PDF
- Ability to share history with external providers
- Real-time updates (polling/websockets)
- Advanced filtering or search within history
- Comparison between visits or trend analysis

## Dependencies

- Existing Visit model in Prisma schema
- Existing QuestionnaireData model
- Existing visits.service.ts methods
- Existing member authentication system
- Existing dashboard layout and navigation

## Success Metrics

- Members can successfully view their complete treatment history
- Page loads in under 2 seconds for typical history (10-20 visits)
- Zero unauthorized access incidents
- Positive user feedback on information completeness
