# TransitOps Driver — React Native (Expo) APK

Native Android/iOS driver app. Same 4 screens + same API as the PWA (`../mobile/`), but produces a real installable **APK**.

## Screens
Login (phone + password) · My Trips (active-first, GPS toggle) · Trip Detail (fuel camera + expense + swipe-to-complete) · Profile.

## Prerequisites
- Node 18+, a free **Expo account** (expo.dev)
- `npm i -g eas-cli`

## First-time setup
```bash
cd transitops-app/mobile-native
npm install
npx expo install   # aligns native module versions to the Expo SDK
```

Add app icons (1024×1024 PNG) at `assets/icon.png` and `assets/adaptive-icon.png` — or run `npx expo prebuild` which generates defaults.

## Point the app at your API
The API URL is baked at build time from `eas.json` → `EXPO_PUBLIC_API_URL`
(currently `https://transit-ops-x-resonance-usye.vercel.app/api`). Edit there if the server URL changes.

For `expo start` local testing on a phone, the phone must reach the API — use the deployed URL (default) or your machine's LAN IP, never `localhost`.

## Build the APK (cloud — no Android Studio needed)
```bash
eas login
eas build:configure          # writes projectId into app.json
eas build -p android --profile preview
```
`preview` profile builds an **APK** (`buildType: apk`). When it finishes, EAS gives a download link — install that .apk on any Android phone (allow "install from unknown sources").

## Local test before building
```bash
npx expo start
```
Scan the QR with the **Expo Go** app. Camera + GPS work in Expo Go for testing.
(Note: production APK bundles native camera/location permissions from `app.json`.)

## Demo login
Dispatcher provisions the password on the web app (Drivers → Set app password).
Seeded: phone `9876500001`, password `driver1234` (Alex).

## Notes
- Permissions declared in `app.json`: `ACCESS_FINE_LOCATION`, `CAMERA`.
- Fuel photos upload to Cloudinary via the server (`transitops/fuel-proofs`).
- Auth token persisted with AsyncStorage; 401 auto-logs-out.
