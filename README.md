# Shibashi

Shibashi is a two-platform product in one repository. The web app and the
mobile app keep their own UI and platform integrations, while product rules,
movement content, meridian knowledge, and sync contracts live in shared
packages.

## Repository layout

```text
apps/
  web/       Next.js web app and sync API
  mobile/    Expo iOS and Android app
packages/    Shared product/domain code consumed by both apps
supabase/    Database schema, migrations, and seed data
design/      Product design references
artifacts/   Review screenshots and source media
```

The web and mobile applications intentionally keep separate dependency locks:
Next.js and Expo have different native/runtime constraints. Install each app
from its own lockfile.

## Run locally

From the repository root:

```bash
npm ci --prefix apps/web
npm ci --prefix apps/mobile
npm run dev:web
npm run dev:mobile
```

Open the web app at `http://localhost:3000`. Expo prints a QR code and device
options for the mobile app. To expose the web sync API to a phone on the same
Wi-Fi, run `npm run dev:web:sync`; set the mobile sync URL for hosted builds.

Web and mobile configuration examples are in `apps/web/.env.example` and
`apps/mobile/.env.example`. Keep actual credentials in the corresponding
ignored `.env.local` files.

## Shared code rules

- Put platform-independent product rules, data models, sync payloads,
  content, and analysis in `packages/`.
- Keep browser APIs, DOM, Next.js, camera capture, native modules, and
  React Native UI inside the matching `apps/web` or `apps/mobile` tree.
- Platform apps may adapt shared domain types at their boundaries; shared
  packages must not import from either app.
- Keep a feature's UI, hooks, and platform-specific service close together.

The mobile Metro config watches the root `packages/` directory so shared source
changes reload during app development.

## Deployment

The Vercel project should use `apps/web` as its Root Directory. Apply Supabase
migrations from `supabase/migrations/` and configure environment variables for
the web and mobile builds separately.

For the current architecture and staged cleanup plan, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).
