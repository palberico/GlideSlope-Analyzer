# React migration — design

## Context

The app (`index.html` landing page + `analyzer.html` flight-log analyzer, sharing
`auth.js` for Firebase auth/Firestore) is currently two static HTML files with
inline `<script>` blocks — no build step, no framework. It has grown to ~1000
lines across the two pages and the user wants to move to React for
maintainability as it keeps growing, while preserving all existing
functionality and the current visual design exactly.

Out of scope: `glideslope.lua` (EdgeTX radio script) and `firestore.rules` are
unrelated to this migration and are not touched.

## Goals

- Port `index.html` and `analyzer.html` to a React + TypeScript app, built with
  Vite.
- Preserve all current functionality: CSV upload/parse, approach detection,
  four canvas visualizations (vertical profile, plan/localizer, deviation-to-go,
  CDI replay with play/scrub/speed), summary stats, Firebase Google/email auth,
  and save/list/delete flights in Firestore.
- Preserve the current visual design pixel-for-pixel as far as practical — same
  CSS custom properties, layout, and chart rendering.
- Deploy to GitHub Pages via GitHub Actions (no server-side rendering, no
  server-side rewrites available).

## Non-goals

- No test suite (none exists today; not adding one as part of this migration).
- No visual redesign — this is a structural port, not a redesign.
- No change to `glideslope.lua` or `firestore.rules`.

## Architecture

- **Build tooling:** Vite + React + TypeScript.
- **Routing:** `react-router-dom` with `HashRouter` — `/` (landing) and
  `/#/analyzer`. Chosen over the alternative (BrowserRouter + a GitHub Pages
  404.html redirect trick for clean URLs) because it needs zero extra
  GitHub Pages configuration. Revisit if clean URLs become a priority later.
- **Deployment:** GitHub Actions workflow triggered on push to `main`:
  `npm ci && npm run build`, then deploy `dist/` to GitHub Pages. `vite.config.ts`
  sets `base` to match the repo's Pages URL path.
- **Firebase config:** Provided at build time via `VITE_FIREBASE_*` environment
  variables, sourced from GitHub Actions repo secrets (`import.meta.env` in
  `lib/firebase.ts`). Locally, developers use a gitignored `.env.local`
  (replacing the current runtime `fetch('./secrets/.env')` pattern). Firebase
  web config is not sensitive — security is enforced by Firestore rules and
  the Auth authorized-domains allowlist — so this is purely a deployment
  convenience decision, not a security requirement.

## File / component structure

```
src/
  main.tsx                # router setup, mounts <App/>
  routes/
    Landing.tsx            # ported from index.html (hero, steps, field-sequence cards)
    Analyzer.tsx            # page shell; owns rows/approaches/slope/selected-index state
  components/
    AuthModal.tsx           # shared Google/email sign-in modal (used on both routes)
    UserBar.tsx             # email + sign-out, used on both routes
    FlightList.tsx          # saved-flights list (open/delete), analyzer only
    DropZone.tsx             # drag-and-drop / browse CSV upload
    SummaryStrip.tsx         # rows/duration/slope/approaches cell strip
    ProfileChart.tsx         # vertical profile canvas
    PlanChart.tsx            # top-down localizer canvas
    DevChart.tsx             # deviation-to-go canvas
    CDIReplay.tsx            # CDI canvas + play/pause/scrub/speed controls
    StatsPanel.tsx           # approach numbers + plain-language verdict
  lib/
    firebase.ts              # replaces auth.js: exports auth, db, configured, friendlyAuthError
    csv.ts                    # parseCSV, validRows, deriveSlope, detectApproaches — logic unchanged
    canvas.ts                 # fit, axes, label, niceStep, roundRect, dot, clamp — shared draw helpers
  hooks/
    useAuth.ts                # wraps onAuthStateChanged into { user, configured }
    useFlights.ts             # Firestore list/save/delete scoped to user.uid
  styles/
    global.css                # current CSS ported ~verbatim (flat classes + :root custom properties)
```

## Data flow

1. File drop or browse → `handleFile` reads the file, calls `parseCSV` (from
   `lib/csv.ts`, logic unchanged from the current vanilla implementation).
2. Parsed rows, derived slope, and detected approaches are stored in React
   state in `Analyzer.tsx` (replacing today's module-level `ROWS`,
   `APPROACHES`, `SLOPE`, `META` globals).
3. The selected-approach index is also component state; `Analyzer.tsx` passes
   the current segment down as props to `ProfileChart`, `PlanChart`,
   `DevChart`, `StatsPanel`, and `CDIReplay`.
4. Each chart component owns its own `<canvas>` ref and redraws inside a
   `useEffect` keyed on `[segment, containerWidth]`, replacing the current
   global `window.addEventListener('resize', renderSeg)`.
5. `CDIReplay` owns the `requestAnimationFrame` play loop locally, with proper
   cleanup in the effect's return function — tightening a rough edge in the
   current implementation, where the RAF handle and playing-state are loose
   module globals.
6. Auth state comes from `useAuth()`; flights list/save/delete comes from
   `useFlights(user)`, both wrapping the same Firebase Firestore calls used
   today.

## Error handling

Identical behavior and messages to today, just surfaced as component state
instead of toggling `.hidden` CSS classes:

- Empty CSV file.
- CSV missing required columns (`ms, dist, cross, vdev, h, tgt`).
- No valid rows (heading never locked).
- Firestore save blocked above ~900KB, with the same warning message.
- Firebase not configured → same `cfgwarn` messaging, sign-in disabled.

## Testing

No test suite exists in the current app; none is being added as part of this
migration. Manual verification (upload a real `glideslope_*.csv`, exercise all
four charts, replay controls, sign-in, save/open/delete a flight) is the
verification method, consistent with how the app is verified today.

## Deployment

- New GitHub Actions workflow (`.github/workflows/deploy.yml`): checkout →
  `npm ci` → `npm run build` → deploy `dist/` to GitHub Pages.
- Firebase config values stored as repo secrets, injected as `VITE_FIREBASE_*`
  build-time env vars.
- `vite.config.ts` `base` set to the repo's Pages path (confirm whether this
  will be a project page, e.g. `username.github.io/Glide`, or a user/custom
  domain page, before setting this — it changes the required `base` value).
