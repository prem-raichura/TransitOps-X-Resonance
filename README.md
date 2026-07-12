# TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform that digitizes vehicle, driver, dispatch,
maintenance, and expense management while enforcing business rules and delivering
operational insights. Built for the Odoo hackathon.

**Live:**
- Web app — https://transit-ops-x-resonance.vercel.app
- API — https://transit-ops-x-resonance-usye.vercel.app

---

## Tech Stack

- **Web client:** React + Vite + Tailwind CSS + Recharts (dark mode, skeleton loaders, RBAC-scoped UI)
- **API:** Node.js + Express + Prisma ORM
- **Database:** Neon (serverless Postgres)
- **Auth:** JWT (staff + separate driver tokens), bcrypt, account lockout
- **Mobile:** React Native (Expo) driver app — installable APK; plus a React PWA variant
- **Media:** Cloudinary (geotagged fuel-meter proof photos)
- **Deploy:** Vercel (web + serverless API)

---

## Structure

```
transitops-app/
├── client/         # React + Vite web app — 4 staff roles
├── server/         # Express + Prisma + Neon Postgres API — auth, RBAC, business rules
├── mobile/         # Driver PWA (Vite) — phone login, trips, GPS, fuel photo proof, swipe-to-complete
└── mobile-native/  # Driver app in React Native (Expo) — builds a real Android APK
```

---

## Features

### 1. Authentication & Role-Based Access Control (RBAC)
- Secure login and authentication for authorized users.
- Role-based access for Fleet Manager, Dispatcher, Safety Officer, Financial Analyst, and Driver.
- Restrict module access based on assigned roles.
- Manage user accounts and permissions.

### 2. Vehicle Management
- Register and maintain fleet vehicle information.
- Track vehicle status (Available, On Trip, In Shop, Retired).
- Monitor vehicle capacity, odometer, and lifecycle.
- Ensure only eligible vehicles are available for trip assignment.

### 3. Driver Management
- Maintain driver profiles and license information.
- Track license validity and safety scores.
- Manage driver availability and duty status.
- Prevent assignment of suspended or expired-license drivers.

### 4. Trip Management & Dispatch
- Create and manage transport trips.
- Assign available vehicles and drivers to trips.
- Validate business rules before dispatch.
- Track trip lifecycle from Draft to Completion.

### 5. Maintenance Management
- Schedule and record vehicle maintenance activities.
- Automatically update vehicle status during maintenance.
- Maintain service history and maintenance costs.
- Restore vehicle availability after maintenance completion.

### 6. Fuel & Expense Management
- Record fuel consumption and fuel costs.
- Track tolls and other operational expenses.
- Calculate operational costs per trip and vehicle.
- Generate expense summaries for financial analysis.

### 7. Dashboard
- Display fleet and trip KPIs in real time.
- Monitor vehicle availability and active trips.
- Provide quick operational insights.
- Support filtering based on vehicle type, region, and status.

### 8. Reports & Analytics
- Generate operational and financial reports.
- Analyze fleet utilization and fuel efficiency.
- Calculate vehicle ROI and operational costs.
- Export reports in CSV format for further analysis.

### Our Extension

#### 9. Driver Mobile Application
- Allow drivers to view assigned trips.
- Submit fuel logs and trip completion requests.
- Enable GPS-based trip tracking.
- Support proof of delivery and completion verification.

#### 10. GPS Tracking
- Track driver locations during active trips.
- Display live vehicle locations to dispatchers.
- Store trip route history.
- Improve fleet visibility and operational monitoring.

---

## Mandatory Business Rules (all enforced server-side)

1. Vehicle registration number must be unique.
2. Retired / In Shop vehicles never appear in dispatch selection.
3. Drivers with expired licenses or Suspended status cannot be assigned to trips.
4. A vehicle or driver already On Trip cannot be assigned to another trip.
5. Cargo weight must not exceed the vehicle's maximum load capacity.
6. Dispatching a trip sets both vehicle and driver to On Trip.
7. Completing a trip sets both back to Available.
8. Cancelling a dispatched trip restores vehicle and driver to Available.
9. Creating an active maintenance record sets the vehicle to In Shop.
10. Closing maintenance restores the vehicle to Available (unless Retired).

All rules run inside Prisma `$transaction`s in the `server/src/services/` layer; the UI mirrors
them for UX (disabled buttons, inline errors) but the server is the authority.

---

## Driver App Flow (extension highlight)

1. Dispatcher provisions a driver's app password (Drivers → Set app password).
2. Driver logs in on the mobile app with phone number + password.
3. Driver sees **only their own** trips.
4. Fuel logging is **camera-first**: photograph the fuel meter, app captures GPS — both mandatory.
5. Completing a trip is a **swipe-to-confirm** with mandatory GPS → the trip goes to
   `PENDING_COMPLETION`, **not** completed.
6. **Dispatcher verifies** on the web live board (sees odometer + GPS pin) → Approve completes
   the trip (Rule 7 fires); Reject sends it back with a reason shown in the app.
7. Driver toggles live location sharing; positions ping every 30s during an active trip.

---

## Setup

Each app has its own `.env` — copy from `.env.example` and fill values.

```bash
# --- server (API) ---
cd server && npm install
cp .env.example .env        # DATABASE_URL (Neon), JWT_SECRET, CLOUDINARY_*, CLIENT_ORIGINS
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                 # http://localhost:5050

# --- client (web) ---
cd client && npm install
cp .env.example .env        # VITE_API_URL
npm run dev                 # http://localhost:5173

# --- mobile (driver PWA) ---
cd mobile && npm install
cp .env.example .env        # VITE_API_URL
npm run dev                 # http://localhost:5174
```

### Driver native app (Android APK)

```bash
cd mobile-native && npm install
npx expo start              # scan QR with Expo Go (SDK 54) for live testing
# build an installable APK (cloud, no Android Studio):
npm i -g eas-cli && eas login
eas build -p android --profile preview
```

The API URL is read from `EXPO_PUBLIC_API_URL` (`.env` for dev, `eas.json` for builds).

> **Note:** all Prisma commands must be run from `server/` so the local Prisma 5 binary is used
> (running elsewhere pulls the latest Prisma and breaks on the schema).

---

## Environment Variables

**server/.env**
```
DATABASE_URL=...            # Neon pooled connection string
JWT_SECRET=...
PORT=5050
CLOUDINARY_CLOUD_NAME=...   # fuel-meter proof photos -> transitops/fuel-proofs
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_ORIGINS=https://<your-client>.vercel.app   # CORS (comma-separated)
```

**client/.env** and **mobile/.env**
```
VITE_API_URL=https://<your-api>.vercel.app/api
```

**mobile-native/.env**
```
EXPO_PUBLIC_API_URL=https://<your-api>.vercel.app/api
```

---

## Demo Credentials (seeded)

| Role | Email / Phone | Password |
|---|---|---|
| Fleet Manager | manager@transitops.in | demo1234 |
| Dispatcher | dispatch@transitops.in | demo1234 |
| Safety Officer | safety@transitops.in | demo1234 |
| Financial Analyst | finance@transitops.in | demo1234 |
| Driver (mobile) | 9876500001 (Alex) | driver1234* |

\* Driver credentials are provisioned by the Dispatcher on the web app.

---

## Deployment (Vercel)

- **Server project:** Root Directory `transitops-app/server`; runs as a serverless function
  (Express is exported, not `listen`ed, under Vercel). Set all `server/.env` variables in
  Vercel → Settings → Environment Variables.
- **Client project:** Root Directory `transitops-app/client`; set `VITE_API_URL`
  (Vite bakes env at build time — redeploy after changing). `vercel.json` provides SPA rewrites.
- Fuel proof photos use Cloudinary because the Vercel serverless filesystem is ephemeral.

---

## Documentation

Full module-by-module plans and the database schema live in [`../PLANS/`](../PLANS/):

- `00-OVERVIEW.md` → `12-GPS-TRACKING.md` — one doc per module
- `13-DRIVER-APP-ROADMAP.md` — mobile UI + feature roadmap
- `PRISMA-SCHEMA.pdf` — full database schema reference
- `10-GIT-WORKFLOW.md` — branch strategy and commit sequence
