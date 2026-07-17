# Approach Review

`app/` is the React app — the home/landing page and the flight-log analyzer
(Google/email sign-in + save-your-flights via Firebase), routed as `/` and
`/#/analyzer`. See `app/README.md` for that app's dev/deploy details, and
`docs/superpowers/specs/2026-07-16-react-migration-design.md` for the
migration design.

`glideslope.lua` is the EdgeTX Tools script that flies the ILS needles and
logs the approach — it's also copied into `app/public/` so the web app can
serve it for download.
