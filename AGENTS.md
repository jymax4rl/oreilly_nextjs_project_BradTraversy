## Cursor Cloud specific instructions

### Overview

**Kama Properties** is a Next.js 16 African vacation rental marketplace (single app in `property_app/`). Tech stack: Next.js (App Router + Turbopack), MongoDB/Mongoose, NextAuth.js v4 (Google OAuth), Flutterwave payments, Tailwind CSS v4, GSAP, styled-components.

### Running services

- **MongoDB**: Must be started before the dev server. Start with:
  ```
  mkdir -p /tmp/mongodb/data && mongod --dbpath /tmp/mongodb/data --fork --logpath /tmp/mongodb/mongod.log --bind_ip 127.0.0.1
  ```
- **Next.js dev server**: `npm run dev` from `property_app/` (runs on port 3000 with Turbopack).

### Key commands (all from `property_app/`)

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Start prod | `npm start` |

### Environment variables

A `.env.local` file is needed in `property_app/`. Required vars: `MONGODB_URI`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_DOMAIN`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`. For local dev, Google OAuth uses placeholder values (login won't work but browsing does). See `scripts/check-env.js` for a quick env check.

### Gotchas

- The app has no automated test suite (no test script in `package.json`). Verification is done via lint + build + manual browser testing.
- `npm run lint` exits with code 1 due to pre-existing lint errors in the codebase (React hooks warnings, unescaped entities). This is expected.
- The `middleware.js` file uses the deprecated Next.js "middleware" convention; a deprecation warning appears at startup — this is harmless.
- MongoDB database name is hardcoded to `KamaProperties` in `config/database.js`.
- Google OAuth is the only auth provider. Without valid OAuth credentials, login will not work, but all public pages (homepage, property listings, property details) are fully browsable.
