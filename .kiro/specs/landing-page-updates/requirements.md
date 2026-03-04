# Requirements Document

## Introduction

This document specifies the requirements for updating the MenoDAO landing page to incorporate new design elements that increase urgency, transparency, and user engagement. The updates will add FOMO elements, CEO messaging, transparency sections, and update the color scheme while maintaining all existing functionality.

## Glossary

- **Landing_Page**: The main public-facing website at menodao-landing/app/page.tsx
- **FOMO_Banner**: Fear Of Missing Out urgency banner displayed at the top of the page
- **Hero_Section**: The main carousel section at the top of the landing page
- **CEO_Message_Section**: A new section featuring a message from Dr. Said Ruwa
- **Chama_Rules_Section**: A new section explaining waiting periods, payment options, and transparency
- **CTA_Button**: Call-to-action button that directs users to sign up
- **Color_Theme**: The primary color scheme used throughout the landing page
- **Social_Links**: Links to MenoDAO's social media profiles (Instagram, TikTok)
- **Carousel**: The rotating hero section with multiple slides
- **Responsive_Design**: Design that adapts to different screen sizes

## Requirements

### Requirement 1: FOMO Urgency Banner

**User Story:** As a potential member, I want to see limited availability information prominently, so that I understand the urgency of signing up.

#### Acceptance Criteria

1. WHEN the landing page loads, THE Landing_Page SHALL display a FOMO_Banner at the very top above all other content
2. THE FOMO_Banner SHALL contain the text "EID PILOT LAUNCH: ONLY 100 SPOTS LEFT IN MOMBASA & KWALE"
3. THE FOMO_Banner SHALL use red or urgent colors (red-600, red-700) to create visual urgency
4. THE FOMO_Banner SHALL include a pulse animation effect to draw attention
5. THE FOMO_Banner SHALL remain visible when scrolling (sticky positioning)
6. THE FOMO_Banner SHALL be responsive and display properly on mobile devices

### Requirement 2: Hero Section Text Updates

**User Story:** As a potential member, I want to see clear, compelling value propositions, so that I understand the benefits immediately.

#### Acceptance Criteria

1. THE Hero_Section SHALL display the headline "Stop Fearing The Dentist Bill."
2. THE Hero_Section SHALL display the sub-headline "Protect Your Family for 350 KES."
3. THE Hero_Section SHALL emphasize "up to 15,000 KES in zero-paperwork dental care" in the value proposition
4. THE Hero_Section SHALL maintain all existing carousel functionality
5. THE Hero_Section SHALL maintain responsive design for mobile devices

### Requirement 3: CEO Message Section

**User Story:** As a potential member, I want to hear from the CEO about why MenoDAO was created, so that I can trust the organization and understand its mission.

#### Acceptance Criteria

1. THE Landing_Page SHALL include a CEO_Message_Section positioned after the hero section
2. THE CEO_Message_Section SHALL display a CEO photo or icon placeholder
3. THE CEO_Message_Section SHALL include a quote from Dr. Said Ruwa about building MenoDAO for the community
4. THE CEO_Message_Section SHALL explain the personal motivation behind creating MenoDAO
5. THE CEO_Message_Section SHALL use a visually distinct design to stand out from other sections
6. THE CEO_Message_Section SHALL be responsive and display properly on mobile devices

### Requirement 4: Chama Rules Transparency Section

**User Story:** As a potential member, I want to understand all the rules and waiting periods upfront, so that I can make an informed decision without surprises.

#### Acceptance Criteria

1. THE Landing_Page SHALL include a Chama_Rules_Section with full transparency information
2. THE Chama_Rules_Section SHALL explain the 14-day waiting period for emergencies
3. THE Chama_Rules_Section SHALL explain the 60-day waiting period for fillings and root canals
4. THE Chama_Rules_Section SHALL explain how to skip waiting periods by paying 1-year upfront
5. THE Chama_Rules_Section SHALL explain money safety through smart contracts and audited treasury
6. THE Chama_Rules_Section SHALL use clear, easy-to-understand language
7. THE Chama_Rules_Section SHALL be visually organized with icons or visual separators
8. THE Chama_Rules_Section SHALL be responsive and display properly on mobile devices

### Requirement 5: CTA Button Updates

**User Story:** As a potential member, I want to see action-oriented buttons that emphasize scarcity, so that I feel motivated to act quickly.

#### Acceptance Criteria

1. WHEN displaying call-to-action buttons, THE Landing_Page SHALL use the text "Secure My Spot" instead of "Join Now"
2. THE CTA_Button text SHALL be updated throughout all sections of the landing page
3. THE CTA_Button SHALL maintain all existing functionality and links
4. THE CTA_Button SHALL maintain hover effects and animations
5. THE CTA_Button SHALL be responsive and display properly on mobile devices

### Requirement 6: Color Scheme Update

**User Story:** As a potential member, I want to see a professional dental care aesthetic, so that the website feels trustworthy and appropriate for healthcare.

#### Acceptance Criteria

1. THE Landing_Page SHALL replace the green theme (#22C55E) with a blue theme
2. THE Color_Theme SHALL use blue-600 and blue-700 as primary colors
3. THE Color_Theme SHALL maintain sufficient contrast for accessibility
4. THE Color_Theme SHALL be applied consistently across all sections
5. THE Color_Theme SHALL maintain visual hierarchy and readability
6. WHEN updating colors, THE Landing_Page SHALL preserve all existing gradients and visual effects with blue equivalents

### Requirement 7: Social Media Links

**User Story:** As a potential member, I want to connect with MenoDAO on social media, so that I can see their content and community engagement.

#### Acceptance Criteria

1. THE Landing_Page SHALL include a link to Instagram at instagram.com/menodao
2. THE Landing_Page SHALL include a link to TikTok at tiktok.com/@yourfavdrpapi
3. THE Social_Links SHALL be displayed in the footer section
4. THE Social_Links SHALL use appropriate icons for each platform
5. THE Social_Links SHALL open in a new tab when clicked
6. THE Social_Links SHALL include proper accessibility attributes (aria-label)

### Requirement 8: Maintain Existing Functionality

**User Story:** As a developer, I want all existing features to continue working, so that the updates don't break the current user experience.

#### Acceptance Criteria

1. WHEN updates are applied, THE Carousel SHALL continue to function with auto-play and manual navigation
2. WHEN updates are applied, THE Landing_Page SHALL maintain all existing graphics and images
3. WHEN updates are applied, THE Responsive_Design SHALL continue to work on all device sizes
4. WHEN updates are applied, THE "How It Works" modal SHALL continue to function properly
5. WHEN updates are applied, THE smooth scrolling navigation SHALL continue to work
6. WHEN updates are applied, THE mobile menu SHALL continue to function properly
