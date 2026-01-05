# MenoDAO Member Portal

Next.js 15 frontend for the MenoDAO dental health membership platform.

## Features

- 📱 **SMS OTP Login** - Secure phone-based authentication
- 🏠 **Member Dashboard** - Overview of subscription, contributions, claims
- 💳 **Package Management** - View, subscribe, and upgrade packages
- 📋 **Claims Portal** - Submit and track dental treatment claims
- 📍 **Camp Finder** - Find dental camps near you with geolocation
- ⛓️ **Blockchain Viewer** - Transparent audit log of all transactions
- 👤 **Profile Management** - Update info, view NFT badges

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/
│   │   │   ├── page.tsx      # Main dashboard
│   │   │   ├── subscription/ # Package management
│   │   │   ├── claims/       # Claims portal
│   │   │   ├── camps/        # Camp finder
│   │   │   ├── transactions/ # Blockchain viewer
│   │   │   └── profile/      # Profile settings
│   │   └── layout.tsx        # Dashboard layout with nav
│   ├── login/
│   │   └── page.tsx          # OTP login page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home (redirects)
│   ├── providers.tsx         # React Query, Auth providers
│   └── globals.css           # Global styles
├── lib/
│   ├── api.ts                # API client with all endpoints
│   └── auth-store.ts         # Zustand auth state
```

## Pages

### Login (`/login`)
- Phone number input
- OTP verification
- Automatic redirect to dashboard

### Dashboard (`/dashboard`)
- Welcome message with member tier
- Quick stats (contributions, claims, limits)
- Current package card with benefits
- Quick action links
- Upcoming camps preview

### Subscription (`/dashboard/subscription`)
- Current package details
- Make monthly payment (M-Pesa/Card)
- View all packages
- Upgrade to higher tier

### Claims (`/dashboard/claims`)
- Claims summary (used, remaining)
- Submit new claim modal
- Claims history with status
- Blockchain transaction links

### Camp Finder (`/dashboard/camps`)
- Enable location for nearby search
- All upcoming camps list
- Distance from user
- Register/cancel registration

### Blockchain (`/dashboard/transactions`)
- Public audit log
- Filter by transaction type
- View on PolygonScan

### Profile (`/dashboard/profile`)
- Update name and location
- View phone number
- Wallet address with explorer link
- NFT badge collection

## API Integration

The API client (`src/lib/api.ts`) handles all backend communication:

```typescript
import { api } from '@/lib/api';

// Auth
await api.requestOtp('+254712345678');
await api.verifyOtp('+254712345678', '123456');

// Profile
const profile = await api.getProfile();
await api.updateProfile({ fullName: 'John Doe' });

// Subscriptions
const packages = await api.getPackages();
await api.subscribe('GOLD');

// Claims
const claims = await api.getMyClaims();
await api.createClaim({ ... });

// Camps
const nearby = await api.getNearby(-4.0435, 39.6682, 50);
await api.registerForCamp(campId);
```

## Authentication Flow

1. User enters phone number
2. Backend sends OTP via SMS
3. User enters 6-digit code
4. Backend verifies and returns JWT
5. Token stored in localStorage
6. Zustand persists auth state

## Styling

Using Tailwind CSS with custom configuration:

- **Primary Color**: Emerald (`#10b981`)
- **Font**: Inter (body), Outfit (headings)
- **Tier Colors**:
  - Bronze: Amber gradient
  - Silver: Gray gradient
  - Gold: Yellow gradient

## Development

```bash
# Run dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

## License

MIT
