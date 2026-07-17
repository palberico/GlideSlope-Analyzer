# Approach Review — Glideslope Toolkit (React app)

Vite + React + TypeScript port of the analyzer/landing pages. See
`../docs/superpowers/specs/2026-07-16-react-migration-design.md` for the
migration design.

## Local development

```
npm install
cp .env.local.example .env.local   # fill in your Firebase web config
npm run dev
```

Firebase config is read from `VITE_FIREBASE_*` environment variables
(`.env.local` is gitignored). Firebase web config is not sensitive — security
is enforced by Firestore rules and the Auth authorized-domains allowlist —
but it's still kept out of local git history for hygiene.

Sign-in needs a real http origin; `npm run dev`'s `localhost` is pre-authorized
by Firebase Auth automatically.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds this app
and publishes `dist/` to GitHub Pages at
`https://palberico.github.io/GlideSlope-Analyzer/`. The Firebase config is
injected at build time from repo secrets
(`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc. — see the workflow
file for the full list). Add your GitHub Pages domain under Firebase Console →
Authentication → Settings → Authorized domains.
