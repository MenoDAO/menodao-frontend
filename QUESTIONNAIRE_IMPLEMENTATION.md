# Comprehensive Dental Questionnaire (CDCQ-v1) Implementation

## Overview

Implemented a comprehensive 7-section dental questionnaire that collects detailed patient data during check-in, immediately after phone number search and active subscription verification.

## Implementation Status

✅ Backend: Complete (merged to dev)
✅ Frontend: Complete (merged to dev)
⏳ Testing: Pending on dev environment

## Architecture

### Backend Changes

**Repository**: menodao-backend
**Branch**: dev
**Commit**: c3d22fc

#### Files Modified:

1. `prisma/schema.prisma` - Added QuestionnaireData model
2. `prisma/migrations/20260226180000_add_cdcq_questionnaire/migration.sql` - Database migration
3. `src/visits/dto/questionnaire.dto.ts` - DTO with validation
4. `src/visits/dto/check-in.dto.ts` - Added optional questionnaire field
5. `src/visits/visits.service.ts` - Updated checkIn method to create questionnaire records

#### Key Features:

- Optional questionnaire (backward compatible)
- Auto-calculates DMFT score from D+M+F components
- Stores all 7 sections in database
- Linked to visit records via visitId

### Frontend Changes

**Repository**: menodao-frontend
**Branch**: dev
**Commit**: cb213d4

#### Files Created:

1. `src/app/staff/components/QuestionnaireForm.tsx` - Multi-section form component (878 lines)

#### Files Modified:

1. `src/app/staff/components/CheckInScreen.tsx` - Integrated questionnaire flow
2. `src/lib/staff-api.ts` - Added QuestionnaireData type and updated CheckInDto

#### Key Features:

- Multi-step form with 7 sections
- Progress indicator showing current section
- Auto-calculated DMFT score display
- Responsive design with Tailwind CSS
- Form validation and state management
- Cancel/Previous/Next navigation

## Questionnaire Sections

### Section 1: Demographics & Consent (Patient)

- Age, gender, education, occupation
- Residence (village/ward, county)
- Research consent checkbox

### Section 2: Medical & Dental History (Patient)

- Last dental visit
- Drug allergies
- Current medications
- Medical conditions (multi-select)
- Family history (multi-select)

### Section 3: Current Dental Concerns (Patient)

- Chief complaint (dropdown)
- Pain level (0-10 slider)
- Recent symptoms (multi-select)

### Section 4: Oral Hygiene & Lifestyle (Patient)

- Brushing frequency
- Flossing frequency
- Sugar intake
- Tobacco use
- Alcohol consumption
- Recreational substance use

### Section 5: Clinical Examination (Clinician Only)

- Oral hygiene index
- Soft tissue findings
- Periodontal status (BPE)
- Dentition status (D, M, F counts)
- DMFT score (auto-calculated)
- Occlusion status

### Section 6: Risk Assessment (Clinician Only)

- Caries risk (CAMBRA)
- Periodontal risk
- Oral cancer risk

### Section 7: Patient Satisfaction (Patient)

- Smile satisfaction
- Care confidence

## User Flow

1. Staff searches for patient by phone number
2. System verifies active subscription
3. Staff fills basic clinical intake (chief complaint, vitals, consent)
4. Staff clicks "CONTINUE TO QUESTIONNAIRE"
5. Questionnaire form appears with section 1
6. User navigates through 7 sections using Next/Previous buttons
7. On section 7, user clicks "Submit Questionnaire"
8. System submits complete check-in with questionnaire data
9. Patient is checked in and sent to treatment room

## Testing Instructions

### Dev Environment

- URL: https://dev.menodao.org/staff/login
- Backend API: https://api.menodao.org (dev environment)

### Test Steps:

1. Login to staff dashboard
2. Search for a patient with active subscription
3. Fill basic clinical intake fields
4. Click "CONTINUE TO QUESTIONNAIRE"
5. Navigate through all 7 sections
6. Verify all field types work correctly:
   - Text inputs
   - Number inputs
   - Dropdowns
   - Checkboxes
   - Multi-select checkboxes
   - Range slider (pain level)
7. Verify DMFT auto-calculation in section 5
8. Submit questionnaire
9. Verify patient is checked in successfully
10. Check database to confirm questionnaire data was saved

### Database Verification:

```sql
-- Check if questionnaire was created
SELECT * FROM "QuestionnaireData"
WHERE "visitId" = '<visit_id>'
ORDER BY "createdAt" DESC
LIMIT 1;
```

## Deployment

### Dev Deployment (Automatic)

- Backend: Pushes to `dev` branch trigger GitHub Actions → ECS deployment
- Frontend: Pushes to `dev` branch trigger Amplify deployment

### Production Deployment (Manual)

After thorough testing on dev:

1. Merge `dev` → `main` for backend
2. Merge `dev` → `main` for frontend
3. Monitor deployments
4. Test on production environment

## Data Privacy & Compliance

- All data protected under Kenya Data Protection Act
- Research consent explicitly requested
- Anonymized patient IDs used for research
- Confidential medical information stored securely
- GDPR/HIPAA considerations included in design

## Next Steps

1. ✅ Complete implementation (Done)
2. ⏳ Test on dev environment (Pending)
3. ⏳ Gather feedback from dental staff
4. ⏳ Make any necessary adjustments
5. ⏳ Deploy to production after verification
6. ⏳ Monitor data collection and usage
7. ⏳ Generate reports for epidemiological analysis

## Notes

- Questionnaire is optional - system remains backward compatible
- Sections 1-4 & 7 designed for patient self-completion
- Sections 5-6 designed for clinician completion during examination
- Form can be cancelled at any time without losing basic check-in data
- All fields are optional except research consent (defaults to false)

## Support

For issues or questions:

- Check GitHub Issues in respective repositories
- Contact development team
- Review this documentation

---

**Last Updated**: 2026-03-01
**Status**: Ready for Testing on Dev Environment
