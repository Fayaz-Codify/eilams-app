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
| Search | Filters, sort, and a card per property with its actual nightly rate for the chosen dates |
| Hotel | Photos, amenities, policies, reviews, and every room priced and marked bookable / sold out |
| Checkout | Guest details, pay at the hotel **or** pay in the app with JazzCash / EasyPaisa |
| Trips | Upcoming and past bookings with reference, payment status and amount due |
| Booking | Full detail, pay a balance, cancel, share |
| Payment | Waits for the wallet to confirm, then shows the outcome |

Push notifications are registered after sign-in (Expo push service) and sent by
the API when a payment lands, a booking is confirmed, or a booking is cancelled.

## Getting started

```sh
npm install
cp .env.example .env.local    # point it at your server
npx expo start
```

Then scan the QR code with **Expo Go** on your phone, or press `i` / `a` for a
simulator.

### The API URL

`EXPO_PUBLIC_API_URL` is the full API base, including `/api/v1`:

```
EXPO_PUBLIC_API_URL=https://eilams.com/api/v1
```

A phone cannot reach `localhost` — that is the phone itself. To develop against
a server on your laptop, use your machine's LAN address:

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:8000/api/v1
```

and make sure the Laravel app allows that origin in `config/cors.php` (needed
only if you also run `expo start --web`).

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
  lib/auth.tsx          session context (SecureStore-backed)
  lib/format.ts         money, dates, status labels
  components/           HotelCard, SearchCard, shared UI
  theme.ts              the Eilams palette, lifted from the website CSS
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run android` / `npm run ios` | Open on a device or simulator |
| `npx expo export --platform ios` | Production bundle check |

## Shipping to the stores

Use Expo Application Services:

```sh
npx eas build --platform all
npx eas submit --platform all
```

You will need an Expo account and a project (`npx eas init`) first. The bundle
identifiers are already set in `app.json`: `com.eilams.app` on both platforms —
change them before the first submission if those do not belong to you.
