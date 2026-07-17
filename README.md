# Approach Review

`app/` is the React app — the home/landing page and the flight-log analyzer
(Google/email sign-in + save-your-flights via Firebase), routed as `/` and
`/#/analyzer`. See `app/README.md` for that app's dev/deploy details, and
`docs/superpowers/specs/2026-07-16-react-migration-design.md` for the
migration design.

`glideslope.lua` is the EdgeTX Tools script that flies the ILS needles and
logs the approach — it's also copied into `app/public/` so the web app can
serve it for download.

## One-time Firebase setup (~10 minutes)

1. **Create a project** at https://console.firebase.google.com → *Add project*.
2. **Register a Web app**: Project Overview → the `</>` (Web) icon → give it a nickname.
   Firebase shows you a `firebaseConfig = { ... }` block. Copy it.
3. **Set the config**: copy the values into `app/.env.local` as `VITE_FIREBASE_API_KEY=`,
   `VITE_FIREBASE_AUTH_DOMAIN=`, etc. — see `app/.env.local.example` for the full list
   and `app/README.md` for how the app reads them. This file is gitignored.
4. **Enable sign-in**: Build → Authentication → Get started → Sign-in method →
   enable **Google** → Save.
5. **Create the database**: Build → Firestore Database → Create database →
   *Production mode*. Then open the **Rules** tab, paste the contents of
   `firestore.rules`, and Publish.

## Run it

Google sign-in needs a real http(s) origin — it will **not** work from `file://`.

- **Local dev:** from this folder, `npm install` then `npm run dev`
  (delegates into `app/`; `localhost` is pre-authorized for Auth).
- **Deploy:** pushing to `main` runs `.github/workflows/deploy.yml`, which
  builds `app/` and publishes it to GitHub Pages. Firebase config is injected
  from repo secrets at build time — see `app/README.md`. Add your GitHub
  Pages domain under Authentication → Settings → Authorized domains.

## How it stores flights

Each saved flight is one Firestore document under `users/{yourUid}/flights/`,
holding the raw CSV text plus name, slope, row count, and timestamp. The rules
above ensure only you can read or write your own flights. Logs must be under
~900 KB (a normal flight is far smaller); larger ones would need Cloud Storage.
