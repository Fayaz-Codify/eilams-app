# Eilams — guest app

The iOS and Android app for [Eilams](https://eilams.com), the Pakistani hotel,
guesthouse and resort booking platform.

It talks to the JSON API in the
[`Fayaz-Codify/staynest`](https://github.com/Fayaz-Codify/staynest) repository —
see `docs/CUSTOMER-APP-API.md` there for every endpoint. This repo contains no
server code: the app is a client, and everything it shows comes from the API.

- **Expo SDK 58**, React Native 0.88, Expo Router
- **TypeScript**, strict
- iOS + Android from one codebase

## What it does

| Screen | What the guest can do |
| --- | --- |
| Sign in / Sign up | Email + password, issued a Sanctum token that is kept in the device Keychain / EncryptedSharedPreferences |
| Explore | Search by destination, dates and guests; destinations with real cover art; featured stays with the price for those dates |
| Search | Destination, date, guest and sort filters; keeps the selected stay when opening a property |
| Hotel | Photos, amenities, policies, reviews, and every room priced and marked bookable / sold out |
| Checkout | Guest details, pay at the hotel **or** pay in the app with JazzCash / EasyPaisa |
| Trips | Upcoming and past bookings with reference, payment status and amount due |
| Booking | Full detail, pay a balance, cancel, share |
| Payment | Waits for the wallet to confirm, then shows the outcome |

Push notifications are registered after sign-in (Expo push service) and sent by
the API when a payment lands, a booking is confirmed, or a booking is cancelled.
Remote push notifications require a native development or store build; Expo Go
is useful for checking the screens and booking flow.

### Guest access

Guests can open Explore, Search, and hotel details without an account. Selecting
a room or opening Trips, Profile, a booking, or a payment prompts sign-in. After
a successful sign-in or sign-up, the app returns to the protected screen and
keeps the selected room, dates, and guest count for checkout.

## Getting started

```sh
npm ci --legacy-peer-deps
cp .env.example .env.local    # point it at your server
npx expo start
```

Scan the QR code with **Expo Go** on a phone on the same Wi-Fi as your computer.
If the phone cannot reach the dev server, run `npx expo start --tunnel` instead.
For a native Android or iOS build, use `npm run android` or `npm run ios` with
the relevant SDK/simulator installed.

### The API URL

`EXPO_PUBLIC_API_URL` is the full API base, including `/api/v1`:

```
EXPO_PUBLIC_API_URL=https://eilams.com/api/v1
```

A phone cannot reach `localhost` — that is the phone itself. To develop against
a server on your laptop, use your machine's private LAN address:

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:8000/api/v1
```

The app's Expo config permits that private-network HTTP URL only in non-production
native builds. Use HTTPS for production. For the web version, make sure the
Laravel app allows the web origin in `config/cors.php`.

API calls time out after 15 seconds with a retryable message. The signed-in
profile is cached in SecureStore so a brief outage does not immediately send a
guest back to the sign-in screen; booking and search still need a connection.

## Payments

The app never touches wallet credentials. It asks the API for a checkout and
either:

- opens the **hosted gateway page** the server renders (JazzCash / EasyPaisa),
  which POSTs the signed fields and redirects back into the app, or
- calls the **test wallet's** signed approve URL, which the server offers while
  no merchant credentials are configured.

Either way, the app then polls `GET /payment-intents/{reference}` — the server
is the only party that knows whether money moved.

## Project layout

```
app/                    Expo Router routes (file-based)
  (auth)/               sign in, sign up
  (tabs)/               Explore, Trips, Profile
  hotel/[slug].tsx      property detail
  checkout.tsx          booking + payment
  booking/[id].tsx      one reservation
  payments/[reference]  waiting for the wallet
src/
  lib/api.ts            the only place that talks to the server
  lib/auth.tsx          SecureStore-backed session and offline profile cache
  lib/format.ts         money, dates, status labels
  components/           HotelCard, SearchCard, shared UI
  theme.ts              the Eilams palette, lifted from the website CSS
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server / show the QR code |
| `npm run android` / `npm run ios` | Build and run a native app on an attached device or simulator |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run check` | Run typecheck and lint together |
| `npx expo export --platform android` / `ios` / `web` | Verify the production bundle for a platform |

## Shipping to the stores

The Android preview profile creates an installable APK. First connect this app
to an Expo project, then build it:

```sh
npx eas init
npx eas build --platform android --profile preview
```

For store builds, use the production profile and submit after building:

```sh
npx eas build --platform all --profile production
npx eas submit --platform all
```

You will need an Expo account. The bundle identifiers are already set in
`app.json`: `com.eilams.app` on both platforms — change them before the first
submission if those do not belong to you.
