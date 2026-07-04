# Expo OSM Demo

The official demo & end-to-end test harness for
[expo-osm-sdk](https://www.npmjs.com/package/expo-osm-sdk) **v2.2.3** (installed
from npm). It exercises the full public API surface — including reliability
features from v2.2.x — and is prepared for publishing to the Google Play Store
(see [Publishing to Google Play](#publishing-to-google-play)).

---

## Screens

### Map tab
- `OSMView` with Indian city markers, tile style switcher (Liberty / Positron / Bright / Dark via OpenFreeMap), zoom controls (`NavigationControls`), and "my location" button (`LocationButton`)
- Tap any city marker to zoom to it
- **`isViewReady()` status pill** — top bar shows whether the native map view is ready
- **Dev only — invalid marker toggle** — in development builds, flip "Bad marker" to inject one out-of-range marker and confirm SDK sanitization skips it (hidden in production store builds)
- **Dev only — snapshot demo** — the "SNAP" button calls `takeSnapshot()` (hidden in production store builds)
- Wrapped in `OSMErrorBoundary` — a simulated crash in the map view can't take down the rest of the app

### Shapes tab
- `Polyline` — Mumbai → Pune route
- `Circle` — radius overlays around Mumbai and Pune
- Also wrapped in `OSMErrorBoundary`

### Route tab
- Exercises ref methods: `displayRoute()`, `clearRoute()`, `fitRouteInView()`
- "Draw route" draws Kolkata → Delhi → Mumbai → Bangalore and fits the camera; "Fit route" re-fits; "Clear route" removes it

### Location tab
- `useLocationTracking` hook demo with live status, GPS coordinates, and map follow while tracking

### App-wide error banner
Every screen's `OSMErrorBoundary.onError` and `OSMView.onError` report into a
shared banner. Async ref calls are wrapped so rejections show friendly alerts
instead of crashing.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | **24** (see repo `.nvmrc`; Node 20 EOL — use `nvm install 24`) |
| npm | ≥ 10 |
| Expo CLI / EAS | latest |

---

## Run locally (npm package — default)

This app depends on **`expo-osm-sdk@^2.2.3` from npm** (same as Play Store /
EAS production builds). **Publish `expo-osm-sdk@2.2.3` to npm before running a
production Play Store build** — EAS resolves the published package, not the local
monorepo sibling.

```bash
cd simple-map-test
npm install
```

A **development build is required** — this SDK uses native modules and does
**not** run in Expo Go:

```bash
npx expo run:android
# or
npx expo run:ios
```

For day-to-day dev with hot reload, use the `development` EAS profile (includes
`expo-dev-client`). **Production Play Store builds** use the `production`
profile, which does **not** enable `developmentClient` — reviewers get a
standard release app.

### Physical device: debug APK vs standalone

**Important:** `npx expo run:android` (and the debug APK at
`android/app/build/outputs/apk/debug/app-debug.apk`) is an **Expo development
client**. It does **not** embed the JavaScript bundle. The app loads JS from
Metro on your computer.

| Goal | Command | Needs Metro? |
|------|---------|--------------|
| Dev with hot reload (emulator or phone on same Wi‑Fi) | `npm start` then `npm run android`, or scan the QR code | Yes |
| Standalone APK on a phone (no dev server) | `npm run android:standalone` | No |
| Internal test / Play Store | `npm run build:android` (EAS preview) or `build:android:production` | No |

If you sideload the **debug** APK onto a phone without Metro running (or without
the phone on the same network as your dev machine), you may see a red screen such
as `[runtime not ready]: TypeError: Cannot read property 'EventEmitter' of
undefined`. That happens because the dev client starts JS before the Expo native
runtime is ready, and modules like `expo-osm-sdk` pull in `expo-modules-core` too
early.

**Fix for standalone phone testing:** build a release APK with an embedded bundle:

```bash
npm run android:standalone
# Output: android/app/build/outputs/apk/release/app-release.apk
```

Or use EAS: `npm run build:android` (preview profile, internal APK).

When using the dev client on a physical device, start Metro first (`npm start`),
ensure the phone is on the same Wi‑Fi, and open the URL shown in the terminal
(e.g. `exp+expo-osm-demo://expo-development-client/?url=http://192.168.x.x:8081`).

### Type-checking

```bash
npm run type-check   # tsc --noEmit
```

---

## Optional: test against local SDK source

To hack on `../expo-osm-sdk` in this monorepo instead of the published npm
release:

```bash
# From simple-map-test/ — copies the sibling package into node_modules
npm run link:sdk-local
npm run prebuild:sdk   # rebuild SDK after source edits
```

Restore the published dependency before a Play Store build:

```bash
npm run link:sdk-npm
```

When using `link:sdk-local`, add `install-links=true` to `.npmrc` (see the
comment in that file) so peer dependencies resolve correctly.

---

## Build with EAS

```bash
# Internal test APK
npm run build:android          # eas build --profile preview --platform android

# Production app bundle (.aab) for the Play Store
npm run build:android:production   # eas build --profile production --platform android
```

The `production` profile in `eas.json` produces an **Android App Bundle**
(`buildType: "app-bundle"`) with `autoIncrement: "versionCode"`, so every
production build gets a new `versionCode` automatically. Bump the semver
`version` in `app.json` / `package.json` for user-facing releases.

### Submitting with EAS Submit

```bash
# Requires google-service-account.json (git-ignored) — see checklist below
npm run submit:android   # eas submit --profile production --platform android
```

Equivalent commands:

```bash
eas build --profile production --platform android
eas submit --profile production --platform android
```

The submit profile targets the **internal** testing track as a **draft** release
first — promote to production in Play Console after verification.

---

## Publishing to Google Play

Prepared for Play Store submission:

| Item | Value |
|------|-------|
| App name | Expo OSM Demo |
| Package | `com.mapdevsaikat.expoosmdemo` |
| Version | `1.2.0` (semver) / `versionCode` 2 (auto-incremented on EAS production builds) |
| SDK | `expo-osm-sdk@^2.2.3` from npm (publish 2.2.3 first) |
| Privacy policy draft | [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) |
| Privacy policy URL (GitHub Pages) | https://mapdevsaikat.github.io/expo-osm-sdk/privacy-policy.html |
| Location permission | Added by `expo-osm-sdk` plugin; usage string in `app.json` |

### Checklist (manual steps)

- [ ] **Google Play Console developer account** ($25 one-time) at [play.google.com/console](https://play.google.com/console)
- [ ] **Service account for EAS Submit** — create in Google Cloud, link under **Setup → API access** in Play Console, download JSON key to `simple-map-test/google-service-account.json` (never commit)
- [ ] **Host privacy policy at a public URL** — push `docs/` to GitHub, enable Pages (see below), then paste **https://mapdevsaikat.github.io/expo-osm-sdk/privacy-policy.html** in **Play Console → App content → Privacy policy**

#### Enable GitHub Pages (one-time)

1. Commit and push the repo-root `docs/` folder (`docs/privacy-policy.html`, `docs/index.html`) to `main`.
2. Open [github.com/mapdevsaikat/expo-osm-sdk/settings/pages](https://github.com/mapdevsaikat/expo-osm-sdk/settings/pages).
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Branch: **`main`**, folder: **`/docs`**, then **Save**.
5. Wait 1–2 minutes; verify **https://mapdevsaikat.github.io/expo-osm-sdk/privacy-policy.html** loads in a browser (incognito is fine).

No GitHub Actions workflow is required — GitHub serves static files from `/docs` on `main` directly.
- [ ] **Store listing** — short/full description (see `app.json` `description`), category (Maps & Navigation or Tools), contact email
- [ ] **Store graphics** — 512×512 icon (`assets/images/icon.png`), 1024×500 feature graphic, ≥2 phone screenshots (Map / Route / Location tabs)
- [ ] **Content rating** questionnaire (no ads, IAP, or UGC → typically Everyone / 3+)
- [ ] **Data safety form** — declare location collected on-device for app functionality, not shared, not stored (matches privacy policy)
- [ ] **Build release AAB**: `eas build --profile production --platform android`
- [ ] **Submit**: `eas submit --profile production --platform android` (or upload `.aab` manually)
- [ ] **Test on internal track** on a real device, then promote to closed/open/production

### Verify install resolves the published SDK

```bash
npm install
npm ls expo-osm-sdk    # should show expo-osm-sdk@2.2.3
```

### Dry-run native project generation (optional)

```bash
npx expo prebuild --platform android --no-install
```

EAS Build runs prebuild automatically; use the command above only to inspect
generated Android config locally.

---

## What this app uses from expo-osm-sdk

| API | Screen |
|-----|--------|
| `OSMView` | All |
| `OSMErrorBoundary` | All (crash isolation) |
| `TILE_CONFIGS` | Map, Shapes, Route, Location |
| `NavigationControls` | Map |
| `LocationButton` | Map |
| `Polyline` | Shapes |
| `Circle` | Shapes |
| `displayRoute` / `clearRoute` / `fitRouteInView` (ref) | Route |
| `isViewReady` (ref) | Map |
| `takeSnapshot` (ref, dev-only demo) | Map |
| `useLocationTracking` | Location |
| `MarkerConfig`, `Coordinate`, `OSMViewRef`, `RouteDisplayOptions` | All (types) |
