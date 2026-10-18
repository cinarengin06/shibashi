# Shibashi architecture and refactor plan

## Product shape

Shibashi has two clients for one product:

- `apps/web`: Next.js web application and sync API.
- `apps/mobile`: Expo app for iOS and Android.
- `packages`: platform-independent domain rules, data contracts, and reusable content.
- `supabase`: database migrations and sync RPC implementation.

The clients intentionally have separate dependency lockfiles. Next.js and Expo have different runtime and native-module constraints. The mobile Metro config watches `packages/` so edits to shared code are visible while developing the native app.

## Sharing boundary

Good candidates for `packages/` are domain calculations, product rules, schemas, content, and API payload contracts. Keep browser APIs, DOM/canvas, Next.js handlers, native modules, camera implementations, and platform UI under the relevant app. Each client should map shared domain payloads into its own view models at the app boundary.

Current shared packages include `shen-domain`, `practice2`, `living-learning`, `onboarding`, `design-tokens`, `experience-design`, `five-shen-content`, and `meridian-knowledge`. Web-only posture analysis lives in `packages/posture-analysis` only where it has no DOM dependency; platform camera capture remains in the clients.

## Data and sync

Supabase migrations are in `supabase/migrations/`. The current sync API is `apps/web/app/api/sync/route.ts`; sync payload types and merge logic live in `packages/shen-domain`. The mobile app calls the same sync contract through `apps/mobile/services/sync/ShibashiSync.ts`.

Before expanding data features, keep migrations additive, preserve `schemaVersion` compatibility, and make authenticated data ownership explicit. Avoid storing large camera images in the JSON sync payload; store media separately and sync stable references.

## Deployment and local setup

- Vercel Root Directory: `apps/web`.
- Web configuration: `apps/web/.env.example` (local secrets in ignored `apps/web/.env.local`).
- Mobile configuration: `apps/mobile/.env.example` (local secrets in ignored `apps/mobile/.env.local`).
- Install each client from its own lockfile, then run root scripts documented in `README.md`.

## Refactor sequence

The current extraction pass has moved web home/posture/practice/journey data, the posture assessment renderer, camera status labels, pose detector and canvas helpers, posture session/report helpers, live practice scoring and widgets, browser coach audio, local history storage, and sync record adapters into `apps/web/features/` and `apps/web/lib/`. On mobile, onboarding steps/styles and the home dashboard cards/styles now live under `apps/mobile/components/`; their route files are composition layers.

Remaining work, measured on 2026-10-18:

1. Continue reducing `apps/web/app/page.tsx` (2,836 lines as of 2026-10-18). The app shell still owns the practice and posture live-screen coordinators and a few audio/session helpers. Move those coordinators into feature components while preserving URL and tab navigation behavior.
2. Split the remaining mobile screens above roughly 500 lines. Current largest candidates are `apps/mobile/app/(tabs)/pratik2.tsx` (923), `apps/mobile/app/(tabs)/index.tsx` (542), `apps/mobile/app/posture-session.tsx` (510), and `apps/mobile/app/(tabs)/profile.tsx` (490). Onboarding is now 257 lines.
3. Prefer shared domain types and calculations over sharing React UI between Next.js and React Native. Extract a `packages/*` module only when it is genuinely platform independent and both clients consume it.
4. Add cross-platform validation around sync payload migrations, auth/data ownership, camera permission flows, and offline behavior when implementation work is requested.

The web entry point remains the largest maintenance risk. These extractions reduce route-level responsibilities but do not complete the web split.

Web and mobile TypeScript checks passed on 2026-10-18 after this extraction pass. This plan records architecture work; it does not claim those remaining screen splits are complete.
