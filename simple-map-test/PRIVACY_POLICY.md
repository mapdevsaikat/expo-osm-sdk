# Privacy Policy — Expo OSM Demo

**Last updated:** 2026-07-08

Expo OSM Demo ("the app") is a free, open-source demo application built to
showcase the [`expo-osm-sdk`](https://github.com/mapdevsaikat/expo-osm-sdk)
React Native / Expo map library. This document explains what data the app
accesses and how it is used.

## Data we collect

**Device GPS location.** When you tap the location button or enable location
tracking, the app asks for your device's location permission (`ACCESS_FINE_LOCATION`
/ `ACCESS_COARSE_LOCATION` on Android, "When In Use" on iOS) so it can:

- Show a blue dot for your current position on the map
- Re-center or follow the map camera on your position
- Demonstrate the SDK's live location tracking hook, including recording a
  GPS track (latitude, longitude, altitude, accuracy, bearing, timestamp)

**Device storage (Files and Media / Photos).** On the Location tab, tapping
**Download Track** exports the recorded GPS track as a GPX file. Writing that
file to shared storage and opening the share sheet is why the app requests
storage access on Android. Map tiles never use this permission — it is only
requested/used when you explicitly tap Download Track.

## How your data is used

- Your location is read **on-device only**, using the operating system's
  standard location services, and is used **exclusively to render your
  position on the map**, and — only while you have tracking active — to build
  the in-memory GPS track shown on the Location tab.
- **Nothing is transmitted off your device.** The app does not have a
  backend server, does not use analytics, and does not send your location
  (or any other data) to us or to any third party.
- **Nothing is stored automatically.** Live location and the recorded GPS
  track are kept only in memory for as long as the app is running and are
  discarded when the app is closed or when you tap "Clear Track". A GPX file
  is written to disk **only when you explicitly tap "Download Track"**, and
  only to hand it off to the share sheet you choose (e.g. Files, Drive,
  email) — the app does not read it back or upload it anywhere.

## Third-party services

The app loads map tiles from third-party map tile providers (e.g.
[OpenFreeMap](https://openfreemap.org), [CARTO](https://carto.com)) so it can
render the map background. These requests contain only the map tile
coordinates being viewed (standard for any map application) — never your
GPS location. Please refer to those providers' own privacy policies for how
they handle standard web request data (such as IP address) on their end.

## Permissions requested

| Permission | Why |
|---|---|
| Location (fine/coarse, "When In Use") | Show your position on the map and demo live tracking |
| Internet / network state | Download map tiles from the tile provider |
| Storage (Files and Media / Photos, Android only) | Save an exported GPX track to shared storage when you tap "Download Track" |

The app does **not** request camera, microphone, contacts, or any other
sensitive permission, and does not request background location access.

## Children's privacy

This app is a general-audience developer demo and is not directed at
children. It does not knowingly collect personal information from anyone.

## Changes to this policy

If this demo app's data practices change, this document will be updated
accordingly. Since this is an open-source project, all changes are visible
in the project's version control history.

## Contact

This is an open-source demo maintained by Saikat Maiti.
Questions or concerns: [mapdevsaikat@gmail.com](mailto:mapdevsaikat@gmail.com)
· [github.com/mapdevsaikat/expo-osm-sdk](https://github.com/mapdevsaikat/expo-osm-sdk)

---

> **Public URL (after GitHub Pages is enabled):**
> https://mapdevsaikat.github.io/expo-osm-sdk/privacy-policy.html
>
> Source HTML lives at `docs/privacy-policy.html` in the repo root. Enable Pages
> under **GitHub repo Settings → Pages → Deploy from branch `main`, folder `/docs`**,
> then paste the URL above into Play Console → **App content → Privacy policy**.
