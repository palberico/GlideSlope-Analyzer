# Approach Review

`app/` is the React app — the home/landing page, flight-log analyzer, and
docs page (Google/email sign-in + save-your-flights via Firebase), routed as
`/`, `/#/analyzer`, and `/#/docs`. See `app/README.md` for that app's
dev/deploy details, and
`docs/superpowers/specs/2026-07-16-react-migration-design.md` for the
migration design.

`app/public/glideslope.lua` is the EdgeTX Tools script that flies the ILS
needles and logs the approach — it's served by the web app for download from
the home page.

Pushing to `main` deploys `app/` to GitHub Pages via
`.github/workflows/deploy.yml`.
