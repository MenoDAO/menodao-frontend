# Implementation Plan: Landing Page Updates

## Overview

This implementation plan breaks down the landing page updates into discrete, incremental tasks. Each task builds on previous work and includes specific requirements references. The plan focuses on adding new sections, updating styling, and maintaining all existing functionality.

## Tasks

- [x] 1. Add FOMO urgency banner at top of page
  - Create fixed banner component above navigation
  - Add red background (bg-red-600) with white text
  - Include pulse animation on text
  - Set z-index to 60 (above nav which is z-50)
  - Add responsive text sizing (text-sm md:text-base)
  - Adjust navigation bar top positioning to account for banner height
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]\* 1.1 Write unit tests for FOMO banner
  - Test banner renders with correct text
  - Test banner has correct styling classes
  - Test banner has fixed positioning
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Update hero section text and CTAs
  - [x] 2.1 Update hero headline to "Stop Fearing The Dentist Bill."
    - Replace existing headline text in carousel slides
    - _Requirements: 2.1_
  - [x] 2.2 Update hero sub-headline to "Protect Your Family for 350 KES."
    - Replace existing sub-headline text
    - _Requirements: 2.2_
  - [x] 2.3 Update value proposition text
    - Emphasize "up to 15,000 KES in zero-paperwork dental care"
    - _Requirements: 2.3_
  - [x] 2.4 Update hero CTA button text
    - Change "Join Now - From KES 350/mo" to "Secure My Spot - From KES 350/mo"
    - _Requirements: 5.1, 5.2_

- [ ]\* 2.5 Write unit tests for hero section updates
  - Test headline text is correct
  - Test sub-headline text is correct
  - Test value proposition includes required text
  - Test CTA button text is updated
  - _Requirements: 2.1, 2.2, 2.3, 5.1_

- [ ]\* 2.6 Write property test for carousel functionality preservation
  - **Property 6: Carousel Functionality Preservation**
  - **Validates: Requirements 2.4, 8.1**

- [x] 3. Create CEO message section
  - [x] 3.1 Add new section after hero, before Compare Plans
    - Create section with gradient background (from-blue-50 to-indigo-50)
    - Add section header with badge and title
    - _Requirements: 3.1_
  - [x] 3.2 Implement CEO card component
    - Add circular photo placeholder with gradient background
    - Add User icon from lucide-react
    - Create two-column layout (photo + message)
    - Make responsive (stacked on mobile, side-by-side on desktop)
    - _Requirements: 3.2, 3.6_
  - [x] 3.3 Add CEO message content
    - Add quote marks for visual emphasis
    - Include message text from Dr. Said Ruwa
    - Add name and title below message
    - _Requirements: 3.3, 3.4_

- [ ]\* 3.4 Write unit tests for CEO message section
  - Test section exists after hero section
  - Test CEO photo placeholder renders
  - Test message content is present
  - Test responsive layout classes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [x] 4. Create Chama rules transparency section
  - [x] 4.1 Add new section after Why MenoDAO, before Transparent Technology
    - Create section with white background and blue top border
    - Add section header with badge and title
    - _Requirements: 4.1_
  - [x] 4.2 Implement waiting periods card
    - Add blue gradient background card
    - Include Clock icon
    - Add 14-day emergency waiting period info
    - Add 60-day filling/root canal waiting period info
    - _Requirements: 4.2, 4.3, 4.7_
  - [x] 4.3 Implement skip waiting card
    - Add green gradient background card
    - Include Zap icon
    - Add 1-year upfront payment info
    - Add immediate access benefit info
    - _Requirements: 4.4, 4.7_
  - [x] 4.4 Implement money safety card
    - Add purple gradient background card
    - Include Shield icon
    - Add smart contract treasury info
    - Add audited and transparent info
    - _Requirements: 4.5, 4.7_
  - [x] 4.5 Implement community governance card
    - Add orange gradient background card
    - Include Users icon
    - Add member voting info
    - Add no hidden fees info
    - _Requirements: 4.7_
  - [x] 4.6 Add trust statement banner
    - Create blue gradient banner at bottom of section
    - Add centered trust message
    - Make responsive
    - _Requirements: 4.8_

- [ ]\* 4.7 Write unit tests for Chama rules section
  - Test section exists in correct location
  - Test all four cards render
  - Test each card contains required information
  - Test icons are present
  - Test responsive grid layout
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

- [x] 5. Checkpoint - Ensure new sections render correctly
  - Verify FOMO banner appears at top
  - Verify CEO message section appears after hero
  - Verify Chama rules section appears after Why MenoDAO
  - Verify all sections are responsive
  - Ask the user if questions arise

- [x] 6. Update color theme from green to blue
  - [x] 6.1 Update primary CTA button colors
    - Replace bg-[#22C55E] with bg-blue-600
    - Replace hover:bg-green-600 with hover:bg-blue-700
    - Update all CTA buttons throughout the page
    - _Requirements: 6.1, 6.2_
  - [x] 6.2 Update navigation bar colors
    - Update "Get Started" button to use blue theme
    - _Requirements: 6.1, 6.2_
  - [x] 6.3 Update section accent colors
    - Update badges from green to blue
    - Update checkmark colors (keep green for success states)
    - Update border colors from green to blue
    - _Requirements: 6.1, 6.2, 6.4_
  - [x] 6.4 Update gradient combinations
    - Replace from-green- with from-blue- in gradients
    - Replace to-green- with to-blue- in gradients
    - Preserve other gradient colors (purple, orange, etc.)
    - _Requirements: 6.6_

- [ ]\* 6.5 Write property test for blue theme consistency
  - **Property 3: Blue Theme Consistency**
  - **Validates: Requirements 6.1, 6.2, 6.4, 6.6**

- [ ]\* 6.6 Write property test for color contrast accessibility
  - **Property 4: Color Contrast Accessibility**
  - **Validates: Requirements 6.3**

- [x] 7. Update all CTA button text
  - [x] 7.1 Update Compare Plans section CTAs
    - Bronze: "Start with Bronze" → "Secure My Bronze Spot"
    - Silver: "Join with Silver" → "Secure My Silver Spot"
    - Gold: "Go Premium with Gold" → "Secure My Gold Spot"
    - _Requirements: 5.1, 5.2_
  - [x] 7.2 Update Why MenoDAO section CTA
    - "Join 500+ Members Today" → "Secure Your Spot Today"
    - _Requirements: 5.1, 5.2_
  - [x] 7.3 Update Contact section CTAs
    - "Join MenoDAO" → "Secure My Spot"
    - _Requirements: 5.1, 5.2_
  - [x] 7.4 Update Footer CTA
    - Keep "Launch App" as is (not a join CTA)
    - _Requirements: 5.1, 5.2_

- [ ]\* 7.5 Write property test for CTA button text consistency
  - **Property 1: CTA Button Text Consistency**
  - **Validates: Requirements 5.1, 5.2**

- [ ]\* 7.6 Write property test for CTA button attribute preservation
  - **Property 2: CTA Button Attribute Preservation**
  - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 8. Update social media links in footer
  - [x] 8.1 Update Instagram link
    - Change href from "#" to "https://instagram.com/menodao"
    - Verify target="\_blank" and rel="noopener noreferrer"
    - Verify aria-label="Instagram"
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_
  - [x] 8.2 Update TikTok link
    - Change href from "#" to "https://tiktok.com/@yourfavdrpapi"
    - Verify target="\_blank" and rel="noopener noreferrer"
    - Verify aria-label="TikTok"
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 8.3 Update WhatsApp link
    - Verify existing WhatsApp link is correct
    - Verify target="\_blank" and rel="noopener noreferrer"
    - Verify aria-label="WhatsApp"
    - _Requirements: 7.3, 7.4, 7.5, 7.6_

- [ ]\* 8.4 Write property test for social link attributes
  - **Property 5: Social Link Attributes**
  - **Validates: Requirements 7.5, 7.6**

- [x] 9. Verify existing functionality preservation
  - [x] 9.1 Test carousel functionality
    - Verify auto-play still works
    - Verify manual navigation (next/prev) works
    - Verify touch gestures work
    - Verify slide indicators work
    - _Requirements: 8.1_
  - [x] 9.2 Test modal functionality
    - Verify "How It Works" modal opens
    - Verify modal closes on X button click
    - Verify modal closes on outside click
    - Verify body scroll lock works
    - _Requirements: 8.4_
  - [x] 9.3 Test navigation functionality
    - Verify smooth scrolling to sections works
    - Verify mobile menu opens and closes
    - Verify navigation links work
    - _Requirements: 8.5, 8.6_
  - [x] 9.4 Test responsive design
    - Verify all sections are responsive
    - Verify mobile menu works on small screens
    - Verify carousel works on touch devices
    - _Requirements: 8.3_
  - [x] 9.5 Test image loading
    - Verify all existing images still load
    - Verify gallery images still load
    - Verify error handling for missing images
    - _Requirements: 8.2_

- [ ]\* 9.6 Write property test for image element preservation
  - **Property 7: Image Element Preservation**
  - **Validates: Requirements 8.2**

- [ ]\* 9.7 Write property test for responsive class preservation
  - **Property 8: Responsive Class Preservation**
  - **Validates: Requirements 2.5, 8.3**

- [ ]\* 9.8 Write property test for modal interaction preservation
  - **Property 9: Modal Interaction Preservation**
  - **Validates: Requirements 8.4**

- [ ]\* 9.9 Write property test for navigation scroll behavior
  - **Property 10: Navigation Scroll Behavior**
  - **Validates: Requirements 8.5**

- [ ]\* 9.10 Write property test for mobile menu functionality
  - **Property 11: Mobile Menu Functionality**
  - **Validates: Requirements 8.6**

- [x] 10. Final checkpoint - Comprehensive testing
  - Run all unit tests
  - Run all property tests
  - Manually test on desktop browser
  - Manually test on mobile device
  - Verify all requirements are met
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation maintains all existing functionality while adding new features
- Color theme updates are applied consistently throughout the page
- All new sections are responsive and follow existing design patterns
