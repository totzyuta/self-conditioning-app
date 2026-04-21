# iOS (Capacitor) — adoption and configuration

## Adoption (shell strategy)

- **A — Primary**: Ship with **Web + Capacitor** (`WKWebView` + bundled `dist`). Native code adds **HealthKit** and future “native islands”.
- **B — Later**: Replace high‑value screens with **Swift/SwiftUI** incrementally while keeping the same API.
- **C — Optional**: Full **SwiftUI** rewrite is a large separate scope; not required for the first release.

## Native rewrite strategy

- Prefer **incremental replacement** (hybrid shell) over an immediate full rewrite to avoid duplicating business logic.
- Keep **HTTP + `x-sync-password`** as the source of truth for sync where possible.

## API base URL (required for device builds)

The web app calls `/api/v2/state` with a **relative URL**. In the Capacitor bundle there is no origin, so set at **build time**:

```bash
VITE_API_BASE_URL=https://your-deployment.vercel.app npm run build
npx cap sync ios
```

Use your real Vercel (or other) HTTPS origin. CORS on the serverless handler already allows arbitrary origins (`Access-Control-Allow-Origin: *`), which includes Capacitor’s app origin.

## Authentication

- Same as the web app: **`x-sync-password`** header on sync API requests (see `api/v2/state.js`). No cookie session for sync.

## HealthKit

- **Read only**: body mass (kg) and step count, merged after the first successful remote fetch.
- **Manual wins**: If the user already entered weight or steps for a day, primary fields stay manual; HealthKit values are stored in **`hkWeight` / `hkSteps`** for that day (local state; not sent as separate columns to the server).

## Xcode / signing

- Open `ios/App/App.xcworkspace` (or the `.xcodeproj` generated alongside it) in Xcode.
- Enable the **Health** capability if Xcode prompts, and use a team that supports **HealthKit** (paid Apple Developer Program may be required for HealthKit entitlements in some setups).

## Scripts

- `npm run cap:sync` — production web build + `cap sync ios` (copies `dist` into the iOS app).

## Xcode: install on your iPhone (development)

Prerequisites: Mac with **Xcode** (App Store), iPhone with **Developer Mode** on if prompted, USB or trusted connection.

1. From the repo root, build the web app and copy assets into the iOS project: `npm run cap:sync`.
2. Open **`ios/App/App.xcodeproj`** in Xcode (or the workspace if you use one).
3. **Signing & Capabilities**: select your **Team** (Personal Team is fine for device-only testing). Resolve any HealthKit signing issues (paid Apple Developer Program may be required for HealthKit in some setups).
4. Choose your **iPhone** as the run destination, then **Run (⌘R)**.
5. On the iPhone: **Settings → General → VPN & Device Management** (or **Device Management**) → trust your developer certificate if required.

For App Store / TestFlight, enroll in the **Apple Developer Program** and archive through Xcode’s **Product → Archive** flow.
