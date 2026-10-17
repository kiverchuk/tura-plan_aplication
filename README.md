# TuraPlan mobile

Offline-first shift calendar for iOS and Android. The app runs without an account or network; local data is stored in SQLCipher SQLite, with its key held by the OS secure store. Laravel sync is optional and is only requested after account sign-in.

## Requirements

- Node.js 22.13 or newer
- Expo SDK 58 / React Native 0.88
- Android Studio for Android development builds; macOS/Xcode for iOS builds

## Setup

```sh
npm ci
npm run start
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the backend origin. For store setup, set the three `EXPO_PUBLIC_STORE_PRODUCT_*` IDs to the products created in App Store Connect and Google Play Console. Keep prices store-sourced; the app displays localized prices returned by the billing SDK. Never put store credentials, service account files, or private keys in the client.

Firebase Analytics uses React Native Firebase and is opt-in. Auto collection and automatic screen reporting are disabled in `firebase.json`; only allowlisted events without parameters are logged after consent. Put the platform configuration files in the project root as `google-services.json` and `GoogleService-Info.plist` (both are git-ignored). The Expo config enables the Firebase plugins only when both files are present. Rebuild a development client after adding them. Calendar data remains in SQLCipher/Laravel and is never sent to Firebase.

Native SQLCipher, purchases, and Firebase require a development or store build; Expo Go is not the production runtime. The client purchase handler submits store receipts to the Laravel verifiers and finalizes transactions only after server verification. Store sandbox testing requires real product IDs and store developer accounts.

Android builds are local. iOS builds go through Expo. This repository does not run GitHub Actions.

## API compatibility

The client pins API contract `1.0.0` in `src/features/sync/contract-version.ts`. The source contract is [`../backend/docs/openapi/openapi.yaml`](../backend/docs/openapi/openapi.yaml); update the server contract first, then update the client pin and typed definitions in the same coordinated change. Product scope and acceptance gates are documented in [`../backend/docs/product/TuraPlan_Implementation_Plan_RU_v1.2_2026-10-17.md`](../backend/docs/product/TuraPlan_Implementation_Plan_RU_v1.2_2026-10-17.md).

## Current native configuration

The app's bundle identifier and store product identifiers must be finalized by the owner before signing and store setup. Firebase project files/IDs are intentionally absent; analytics must remain opt-in and cannot store calendar data. Holiday packs must not be published until sources and licenses for each region have been reviewed.
