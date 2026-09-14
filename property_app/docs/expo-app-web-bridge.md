# Expo web on app.isisel.com (temporary bridge)

`https://app.isisel.com` and `https://m.isisel.com` serve the **isisel-mobile** Expo web export from this Next.js project until a dedicated Vercel project can be created.

## How it works

- `npm run build` runs `scripts/fetch-expo-web.mjs` first, which downloads a prebuilt Expo web tarball from Cloudinary into `public/_expo`, `public/assets`, and `public/app-web`.
- `middleware.js` rewrites only `app.isisel.com` / `m.isisel.com` to those static files (`www.isisel.com` is unchanged).

Override the bundle with `EXPO_WEB_DIST_URL`.

## Refresh the export

From `jymax4rl/isisel-mobile` on `master`:

```bash
export EXPO_PUBLIC_API_BASE_URL=https://www.isisel.com
export EXPO_PUBLIC_MOCK_AUTH=false
export EXPO_PUBLIC_WEB_ORIGIN=https://app.isisel.com
npm ci && npx expo export --platform web
(cd dist && tar -czf /tmp/dist-bundle.js .)
# Upload /tmp/dist-bundle.js to Cloudinary as raw (public_id under isisel/expo-web)
# then update EXPO_WEB_DIST_URL / the default URL in fetch-expo-web.mjs
```

## Target end state

Import `jymax4rl/isisel-mobile` as its own Vercel project, move the domains off `kemika02`, and delete this bridge.
