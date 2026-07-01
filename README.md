# NearU — Hyper-Local Campus Service & Gig Marketplace

NearU is a hyper-local service discovery, booking, and gig marketplace designed specifically for university campuses, with special support for the Sabaragamuwa University of Sri Lanka (SUSL) community. The application bridges the gap between students, local student riders, and campus-adjacent businesses, offering a seamless and unified platform for commerce, transport, accommodation, and micro-employment.

---

## 📱 Features & Role-Based Workflows

NearU adapts dynamically to three distinct system roles, providing a tailored user interface and dashboard for each:

### 1. Students & Guests (Default Role)
* **Browse & Search:** Instantly discover local services, shops, and trending student deals.
* **Food & Essentials Ordering:** Order food, laundry services, printing, and custom errands.
* **Campus Rides:** Request on-demand rides from registered student riders.
* **Career Hub & Gigs:** Browse, search, and apply for student-friendly part-time jobs and campus gigs.
* **Accommodations Finder:** Search, filter, and view nearby hostels, boarding rooms, and student accommodations.
* **Favourites:** Save preferred shops and listings for quick access.

### 2. Student Riders
* **Rider Dashboard:** Toggle active status and view incoming delivery/ride requests.
* **Active Job Tracking:** Receive real-time navigation routes, customer contacts, and job details.
* **Delivery History:** Track completed gigs, earnings, and delivery stats.
* **Rider Profile:** Manage vehicle information, rating cards, and payment details.

### 3. Campus Businesses
* **Shop Dashboard:** Oversee restaurant, gift-shop, or accommodation listings.
* **Menu & Service Management:** Add, update, or temporarily disable products and listings.
* **Deals & Promotions:** Submit hot deals and offers directly to the student browse feed.
* **Business Profile:** Edit opening hours, contact details, and locations.

---

## 🛠️ Technology Stack

* **Framework:** [Expo SDK 54](https://docs.expo.dev) (using Expo Router for file-based navigation)
* **Core:** React Native (0.81.5) & TypeScript
* **State & Authentication:** Context-driven state with JWT-based session persistence via [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/secure-store/)
* **HTTP Client:** [Axios](https://github.com/axios/axios) with automatic JWT refresh interceptors
* **Icons:** [lucide-react-native](https://lucide.dev)
* **Animation:** [react-native-reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/)

---

## 📁 Repository Structure

```text
NearU-Mobile-App/
├── app/                      # Expo Router navigation root
│   ├── (auth)/               # Authentication flow (Login, Registration, Verification)
│   ├── (tabs)/               # Main role-based tab navigation
│   │   ├── browse.tsx        # Home/Dashboard browse feed
│   │   ├── favourites.tsx    # Saved/Favorite listings or history
│   │   ├── profile.tsx       # Dynamic profile settings (Student, Rider, Business)
│   │   └── rides.tsx         # Active ride tracking & requests
│   ├── accommodations/       # Accommodation detailed screens
│   ├── deals/                # Promotional deals and discounts
│   ├── food/                 # Food shop menu and ordering
│   ├── gifts/                # Gift items and store catalog
│   ├── photography/          # Local photographers booking & galleries
│   ├── service/              # General services (Laundry, Printing, etc.)
│   └── _layout.tsx           # Global routing & authentication gateway
├── components/               # Reusable UI components
│   ├── accommodations/       # Accommodation-specific UI (e.g., CreateAccommodationModal)
│   ├── business/             # Business management views (e.g., BusinessProfileView)
│   ├── home/                 # Dashboard components (HotDeals, ServiceGrid)
│   ├── jobs/                 # Gig/Job details and submission forms
│   └── Button.tsx            # Custom design tokens-themed button
├── constants/                # Global style and routing configs
│   ├── API_Endpoints.ts      # Core API endpoints & .NET Backend paths
│   └── Colors.ts             # Light/Dark mode theme definitions
├── hooks/                    # Custom React hooks
│   ├── useAuth.tsx           # Session management & user session check
│   ├── useLocation.ts        # Geolocation hooks for campus location check
│   └── useProfile.ts         # User profile data management
├── services/                 # Backend communications layer
│   ├── api.ts                # Configured Axios client with self-healing interceptors
│   ├── GoogleSigninWrapper.ts# Google OAuth client helper
│   ├── jobService.ts         # Gig list & creation requests
│   └── riderService.ts       # Ride-hailing & rider operations requests
├── assets/                   # App logos, launch splash, and icons
├── app.json                  # Expo config file (OAuth configurations, package details)
└── package.json              # Project dependencies & startup scripts
```

---

## 🚀 Getting Started

### Prerequisites

* Ensure you have [Node.js](https://nodejs.org) (v18 or higher recommended) installed.
* [Expo Go](https://expo.dev/client) app installed on your physical iOS/Android device, or an active simulator.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nearu-Project-SUSL/NearU-Moblie-App.git
   cd NearU-Mobile-App
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or copy from the existing setup):
   ```env
   # Backend API Gateway Configuration
   EXPO_PUBLIC_API_BASE_URL=https://api.nearusab.me/api
   EXPO_PUBLIC_APP_ENV=development

   # Firebase Web SDK Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
   EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID

   # Google OAuth Client Credentials
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=YOUR_GOOGLE_CLIENT_ID_WEB
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=YOUR_GOOGLE_CLIENT_ID_ANDROID
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=YOUR_GOOGLE_CLIENT_ID_IOS
   ```

### Running the App

Start the Expo development server:

```bash
npm run start
```

* **Android Device/Emulator:** Press `a` in the terminal to launch.
* **iOS Simulator:** Press `i` to launch.
* **Web Version:** Press `w` to open in browser.
* **Physical Device:** Scan the QR code displayed in the terminal using the Expo Go app.

For native build generation:
```bash
# For Android native dev builds
npm run android

# For iOS native dev builds
npm run ios
```

---

## 🔒 Session Security & API Architecture

NearU communicates with a remote .NET Web API backend. Security is managed as follows:

* **Authorization Interceptor:** The configured Axios client in [api.ts](./services/api.ts) automatically appends the user's JWT Bearer Token to all requests.
* **Self-Healing Token Refresh:** If a request fails with an HTTP `401 Unauthorized` status, the response interceptor attempts to fetch a fresh token via the `/auth/refresh` endpoint using the secure refresh token stored in the device's Secure Store. If successful, the original request is seamlessly retried.
* **Security Guard Routing:** Layout routes in [app/_layout.tsx](./app/_layout.tsx) are dynamically guarded, ensuring unauthenticated users are immediately redirected to the login flow, while authenticated users bypass auth prompts.

---

## ⚖️ License

Private repository. Copyright (c) 2026 NearU SUSL Project. All rights reserved.
