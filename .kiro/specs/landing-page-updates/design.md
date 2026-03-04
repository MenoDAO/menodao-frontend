# Design Document: Landing Page Updates

## Overview

This design document outlines the technical approach for updating the MenoDAO landing page with new sections, updated styling, and enhanced user engagement elements. The updates will add a FOMO urgency banner, CEO message section, transparency section about Chama rules, update the color scheme from green to blue, and update CTA button text throughout the page.

The implementation will maintain all existing functionality including the carousel, responsive design, modal interactions, and smooth scrolling navigation while adding new sections and updating visual styling.

## Architecture

### Component Structure

The landing page is a single Next.js client component (`app/page.tsx`) that uses React hooks for state management. The architecture follows this structure:

```
Home Component (Main)
├── State Management (useState hooks)
│   ├── scrolled (navbar transparency)
│   ├── isHowItWorksOpen (modal state)
│   ├── mobileMenuOpen (mobile nav state)
│   ├── currentSlide (carousel state)
│   └── touch handlers (swipe state)
├── Effects (useEffect hooks)
│   ├── Scroll listener
│   ├── Modal body scroll lock
│   ├── Modal scroll reset
│   └── Carousel auto-play
└── Rendered Sections
    ├── FOMO Banner (NEW)
    ├── Navigation Bar
    ├── Hero Carousel Section
    ├── CEO Message Section (NEW)
    ├── Compare Plans Section
    ├── Why MenoDAO Section
    ├── Chama Rules Section (NEW)
    ├── Transparent Technology Section
    ├── About Section
    ├── Services Section
    ├── Gallery Section
    ├── Contact Section
    ├── Footer
    └── How It Works Modal
```

### Technology Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Images**: Next.js Image component with optimization
- **Interactivity**: React hooks (client-side)

## Components and Interfaces

### 1. FOMO Urgency Banner Component

**Location**: Top of the page, above navigation

**Structure**:

```tsx
<div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white">
  <div className="max-w-7xl mx-auto px-4 py-3 text-center">
    <p className="text-sm md:text-base font-bold animate-pulse">
      🔥 EID PILOT LAUNCH: ONLY 100 SPOTS LEFT IN MOMBASA & KWALE
    </p>
  </div>
</div>
```

**Styling Details**:

- Fixed positioning with z-index 60 (above nav which is z-50)
- Red background (bg-red-600)
- White text with bold font weight
- Pulse animation on text
- Responsive text sizing (text-sm on mobile, text-base on desktop)
- Centered content with max-width container

**Integration**:

- Navigation bar must account for banner height (add top padding/margin)
- Hero section must account for banner height in viewport calculations

### 2. Hero Section Updates

**Changes Required**:

- Update headline text to "Stop Fearing The Dentist Bill."
- Update sub-headline to "Protect Your Family for 350 KES."
- Update value proposition to emphasize "up to 15,000 KES in zero-paperwork dental care"
- Update CTA button text from "Join Now - From KES 350/mo" to "Secure My Spot - From KES 350/mo"

**Current Structure** (to be modified):

```tsx
<h1>Stop Paying KES 30,000</h1>
<h1>When You're in Pain</h1>
```

**New Structure**:

```tsx
<h1>Stop Fearing The Dentist Bill.</h1>
<h1>Protect Your Family for 350 KES.</h1>
```

### 3. CEO Message Section

**Location**: After hero section, before Compare Plans section

**Structure**:

```tsx
<section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          Message from Leadership
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
          Why We Built MenoDAO
        </h2>
      </div>

      {/* CEO Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* CEO Photo */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <User className="h-12 w-12 md:h-16 md:w-16 text-white" />
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 text-center md:text-left">
            <div className="text-4xl md:text-5xl text-blue-600 mb-4">"</div>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
              I built MenoDAO because I saw too many families choosing between
              dental care and putting food on the table. No one should have to
              make that choice. By pooling our resources as a community, we can
              all afford the care we deserve.
            </p>
            <div className="border-t border-gray-200 pt-6">
              <p className="font-bold text-gray-900 text-lg">Dr. Said Ruwa</p>
              <p className="text-gray-600">Founder & CEO, MenoDAO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Design Rationale**:

- Gradient background (blue theme) creates visual distinction
- Card-based layout with shadow for depth
- Circular photo placeholder with gradient (can be replaced with actual photo)
- Quote marks for visual emphasis
- Responsive layout (stacked on mobile, side-by-side on desktop)

### 4. Chama Rules Transparency Section

**Location**: After Why MenoDAO section, before Transparent Technology section

**Structure**:

```tsx
<section className="py-20 md:py-32 bg-white border-t-4 border-blue-600">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Section Header */}
    <div className="text-center mb-16">
      <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
        Full Transparency
      </span>
      <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-4">
        How Our Chama Works
      </h2>
      <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
        No hidden rules. No surprises. Here's exactly how MenoDAO operates.
      </p>
    </div>

    {/* Rules Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {/* Waiting Periods Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Waiting Periods</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">
                Emergency Care: 14 Days
              </p>
              <p className="text-sm text-gray-600">
                Pain relief and urgent consultations
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">
                Fillings & Root Canals: 60 Days
              </p>
              <p className="text-sm text-gray-600">
                Major procedures require longer waiting period
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Skip Waiting Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Skip the Wait</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">Pay 1 Year Upfront</p>
              <p className="text-sm text-gray-600">
                Get immediate access to all benefits
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">No Waiting Periods</p>
              <p className="text-sm text-gray-600">
                Start using your benefits right away
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Money Safety Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            Your Money is Safe
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">
                Smart Contract Treasury
              </p>
              <p className="text-sm text-gray-600">
                Funds secured by blockchain technology
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">
                Audited & Transparent
              </p>
              <p className="text-sm text-gray-600">
                Every transaction is recorded and verifiable
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Governance Card */}
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border-2 border-orange-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Member-Owned</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">You Have a Voice</p>
              <p className="text-sm text-gray-600">
                Members vote on major decisions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">No Hidden Fees</p>
              <p className="text-sm text-gray-600">
                All costs are transparent and agreed upon
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Trust Statement */}
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
      <h3 className="text-2xl md:text-3xl font-bold mb-4">
        Built on Trust, Powered by Community
      </h3>
      <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
        Every rule exists to protect members and ensure fairness. We believe in
        complete transparency because your trust is our foundation.
      </p>
    </div>
  </div>
</section>
```

**Design Rationale**:

- Four-card grid layout for organized information presentation
- Color-coded cards for different rule categories
- Icons for visual recognition
- Border accent at top for section emphasis
- Trust statement banner at bottom for emotional connection

### 5. Color Scheme Updates

**Current Theme**:

- Primary: `#22C55E` (green-500)
- Hover: green-600
- Accents: emerald shades

**New Theme**:

- Primary: `#2563EB` (blue-600)
- Hover: `#1D4ED8` (blue-700)
- Accents: blue and indigo shades

**Files to Update**:

- All instances of `bg-[#22C55E]` → `bg-blue-600`
- All instances of `hover:bg-green-600` → `hover:bg-blue-700`
- All instances of `text-green-` → `text-blue-`
- All instances of `border-green-` → `border-blue-`
- Gradient combinations: `from-green-` → `from-blue-`

**Preservation**:

- Keep emerald/green colors in specific contexts (checkmarks, success states)
- Maintain gradient variety (purple, orange, etc.) for visual interest
- Preserve accessibility contrast ratios

### 6. CTA Button Text Updates

**Locations to Update**:

1. Hero section primary CTA
2. Compare Plans section CTAs (3 buttons)
3. Why MenoDAO section CTA
4. Contact section CTA
5. Footer CTA

**Text Changes**:

- "Join Now" → "Secure My Spot"
- "Join with Silver" → "Secure My Silver Spot"
- "Go Premium with Gold" → "Secure My Gold Spot"
- "Join 500+ Members Today" → "Secure Your Spot Today"

**Maintain**:

- All button styling and hover effects
- All links and functionality
- All responsive behavior

### 7. Social Media Links Updates

**Footer Social Icons Section**:

Current structure has placeholder `href="#"` links. Update to:

```tsx
<a
  href="https://wa.me/254743178950"
  target="_blank"
  rel="noopener noreferrer"
  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200"
  aria-label="WhatsApp"
>
  <MessageCircle className="h-5 w-5 text-white" />
</a>
<a
  href="https://tiktok.com/@yourfavdrpapi"
  target="_blank"
  rel="noopener noreferrer"
  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200"
  aria-label="TikTok"
>
  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
</a>
<a
  href="https://instagram.com/menodao"
  target="_blank"
  rel="noopener noreferrer"
  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200"
  aria-label="Instagram"
>
  <Instagram className="h-5 w-5 text-white" />
</a>
```

## Data Models

No new data models are required. The component uses existing React state:

```typescript
interface ComponentState {
  scrolled: boolean; // Navbar transparency state
  isHowItWorksOpen: boolean; // Modal visibility
  mobileMenuOpen: boolean; // Mobile nav state
  currentSlide: number; // Carousel position
  touchStart: number; // Touch gesture tracking
  touchEnd: number; // Touch gesture tracking
}
```

## Error Handling

### Image Loading Errors

The existing `GalleryImage` component handles image loading errors:

```typescript
const [hasError, setHasError] = useState(false);
const [imageLoaded, setImageLoaded] = useState(false);

// Error handling
if (hasError) {
  return null; // Don't render if image fails
}

// Loading state
{!imageLoaded && (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent" />
  </div>
)}
```

**Maintain this pattern** for all image components.

### Navigation Errors

Smooth scroll navigation includes error handling:

```typescript
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    // Calculate offset and scroll
    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
    setMobileMenuOpen(false);
  }
  // Silently fail if element not found
};
```

### Modal State Management

Modal includes body scroll lock to prevent background scrolling:

```typescript
useEffect(() => {
  if (isHowItWorksOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "unset";
  }
  return () => {
    document.body.style.overflow = "unset"; // Cleanup
  };
}, [isHowItWorksOpen]);
```

## Testing Strategy

### Unit Testing Approach

Unit tests should focus on:

1. **Component Rendering**
   - FOMO banner renders with correct text
   - CEO message section renders with correct content
   - Chama rules section renders all four cards
   - Social links have correct href attributes

2. **State Management**
   - Carousel state updates correctly
   - Modal state toggles properly
   - Mobile menu state toggles properly
   - Scroll state updates on scroll events

3. **User Interactions**
   - CTA buttons have correct text
   - Social links open in new tabs
   - Navigation scrolls to correct sections
   - Touch gestures update carousel

4. **Styling**
   - Color theme uses blue instead of green
   - FOMO banner has pulse animation
   - Responsive classes are applied correctly

### Property-Based Testing Approach

Property-based tests will be written using fast-check (JavaScript/TypeScript PBT library) with minimum 100 iterations per test.

Each property test will:

- Generate random test data
- Verify universal properties hold across all inputs
- Reference the specific design property being validated
- Use the tag format: `Feature: landing-page-updates, Property {number}: {property_text}`

### Testing Configuration

- **Framework**: Jest with React Testing Library
- **PBT Library**: fast-check
- **Minimum Iterations**: 100 per property test
- **Coverage Target**: 80%+ for new sections

### Integration Testing

Integration tests should verify:

- New sections integrate properly with existing layout
- Navigation includes new sections in scroll calculations
- FOMO banner doesn't break navbar positioning
- Color theme updates don't break visual hierarchy
- All links and CTAs navigate correctly

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancy Analysis:**

- Properties 5.1 and 5.2 (CTA button text updates) can be combined into a single property about consistent CTA text across all buttons
- Properties 5.3, 5.4, and 5.5 (CTA button functionality, hover effects, responsive) can be combined into a single property about preserving all CTA button attributes
- Properties 6.1, 6.2, 6.4, and 6.6 (color theme updates) can be combined into a single comprehensive property about consistent blue theme application
- Properties 7.5 and 7.6 (social link attributes) can be combined into a single property about proper link attributes
- Properties 8.1, 8.2, 8.3, 8.4, 8.5, and 8.6 (maintaining existing functionality) can be combined into fewer comprehensive properties about preserving interactive features and responsive behavior

**Consolidated Properties:**
After reflection, the testable properties have been consolidated to eliminate logical redundancy while maintaining comprehensive coverage.

### Property 1: CTA Button Text Consistency

_For any_ call-to-action button on the landing page, the button text should use "Secure My Spot" or a variant thereof (e.g., "Secure My Silver Spot", "Secure Your Spot Today") and should not contain the old text "Join Now".

**Validates: Requirements 5.1, 5.2**

### Property 2: CTA Button Attribute Preservation

_For any_ call-to-action button on the landing page, the button should maintain its href attribute, hover effect classes (hover:bg-, hover:scale-), and responsive classes (px-, py-, text-).

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 3: Blue Theme Consistency

_For any_ element that previously used green theme colors (#22C55E, green-500, green-600), the element should now use blue theme colors (blue-600, blue-700) and no green theme colors should remain in primary action elements.

**Validates: Requirements 6.1, 6.2, 6.4, 6.6**

### Property 4: Color Contrast Accessibility

_For any_ text element on a colored background, the color combination should meet WCAG AA contrast ratio requirements (minimum 4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 6.3**

### Property 5: Social Link Attributes

_For any_ social media link in the footer, the link should have target="\_blank", rel="noopener noreferrer", and an aria-label attribute.

**Validates: Requirements 7.5, 7.6**

### Property 6: Carousel Functionality Preservation

_For any_ carousel interaction (auto-play timer, next/previous buttons, touch gestures, slide indicators), the interaction should trigger the expected state change in currentSlide and update the visible slide.

**Validates: Requirements 2.4, 8.1**

### Property 7: Image Element Preservation

_For any_ image element that existed in the original landing page, the image element should still exist with the same src attribute after updates are applied.

**Validates: Requirements 8.2**

### Property 8: Responsive Class Preservation

_For any_ element with responsive behavior (breakpoint classes like md:, lg:, sm:), the element should maintain those responsive classes after updates are applied.

**Validates: Requirements 2.5, 8.3**

### Property 9: Modal Interaction Preservation

_For any_ modal interaction (opening modal, closing modal, clicking outside modal), the interaction should correctly update the isHowItWorksOpen state and apply/remove body scroll lock.

**Validates: Requirements 8.4**

### Property 10: Navigation Scroll Behavior

_For any_ navigation link click, the page should smoothly scroll to the target section with the correct header offset calculation.

**Validates: Requirements 8.5**

### Property 11: Mobile Menu Functionality

_For any_ mobile menu interaction (opening menu, closing menu, clicking menu item), the interaction should correctly update the mobileMenuOpen state and close the menu after navigation.

**Validates: Requirements 8.6**

### Example-Based Test Cases

The following acceptance criteria are best tested with specific examples rather than properties:

**FOMO Banner Tests (Requirements 1.1-1.6):**

- Test that FOMO banner renders at top of page with fixed positioning
- Test that banner contains exact text "EID PILOT LAUNCH: ONLY 100 SPOTS LEFT IN MOMBASA & KWALE"
- Test that banner has red background (bg-red-600)
- Test that banner text has animate-pulse class
- Test that banner has z-index higher than navigation (z-[60])
- Test that banner has responsive text sizing (text-sm md:text-base)

**Hero Section Text Tests (Requirements 2.1-2.3):**

- Test that hero displays headline "Stop Fearing The Dentist Bill."
- Test that hero displays sub-headline "Protect Your Family for 350 KES."
- Test that value proposition includes "up to 15,000 KES in zero-paperwork dental care"

**CEO Message Section Tests (Requirements 3.1-3.4, 3.6):**

- Test that CEO message section exists after hero section
- Test that section contains CEO photo/icon placeholder
- Test that section contains quote from Dr. Said Ruwa
- Test that section contains motivation text
- Test that section has responsive layout classes

**Chama Rules Section Tests (Requirements 4.1-4.5, 4.7, 4.8):**

- Test that Chama rules section exists
- Test that section explains 14-day emergency waiting period
- Test that section explains 60-day filling/root canal waiting period
- Test that section explains 1-year upfront payment option
- Test that section explains smart contract treasury and auditing
- Test that section contains icons for each card
- Test that section has responsive grid layout

**Social Media Link Tests (Requirements 7.1-7.4):**

- Test that Instagram link exists with href "https://instagram.com/menodao"
- Test that TikTok link exists with href "https://tiktok.com/@yourfavdrpapi"
- Test that social links are in footer section
- Test that each social link has appropriate icon element

### Edge Cases

The following edge cases should be handled by the property test generators:

**Responsive Breakpoints:**

- Test behavior at exact breakpoint widths (640px, 768px, 1024px, 1280px)
- Test behavior at very small screens (320px)
- Test behavior at very large screens (1920px+)

**Carousel Edge Cases:**

- Test carousel at first slide (previous button behavior)
- Test carousel at last slide (next button behavior)
- Test carousel with rapid navigation clicks
- Test carousel with interrupted auto-play

**Touch Gesture Edge Cases:**

- Test very short swipe distances (< 50px)
- Test swipes that don't complete (touchEnd not fired)
- Test multi-touch scenarios

**Color Contrast Edge Cases:**

- Test contrast on gradient backgrounds (use darkest point)
- Test contrast on semi-transparent overlays
- Test contrast with white text on blue backgrounds
