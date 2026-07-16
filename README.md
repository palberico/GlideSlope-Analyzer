# Approach Review — cloud setup

`index.html` is the home/landing page — download `glideslope.lua` and jump to the analyzer.
`analyzer.html` is the analyzer with Google sign-in + save-your-flights (Firebase).
`glideslope.lua` is the EdgeTX Tools script that flies the ILS needles and logs the approach.

## One-time Firebase setup (~10 minutes)

1. **Create a project** at https://console.firebase.google.com → *Add project*.
2. **Register a Web app**: Project Overview → the `</>` (Web) icon → give it a nickname.
   Firebase shows you a `firebaseConfig = { ... }` block. Copy it.
3. **Set the config**: copy the values into `secrets/.env` as `FIREBASE_API_KEY=`,
   `FIREBASE_AUTH_DOMAIN=`, etc. (see `secrets/README.md`). `analyzer.html` fetches
   this file at load time — it is never committed to git.
4. **Enable sign-in**: Build → Authentication → Get started → Sign-in method →
   enable **Google** → Save.
5. **Create the database**: Build → Firestore Database → Create database →
   *Production mode*. Then open the **Rules** tab, paste the contents of
   `firestore.rules`, and Publish.

## Run it

Google sign-in needs a real http(s) origin — it will **not** work from `file://`.

- **Quick local test:** in this folder run `python3 -m http.server 5000`
  then open `http://localhost:5000/` (localhost is pre-authorized for Auth).
- **Publish it:** install the Firebase CLI (`npm i -g firebase-tools`),
  `firebase login`, `firebase init hosting` (public dir = this folder,
  single-page = no), then `firebase deploy`. Add your deployed domain under
  Authentication → Settings → Authorized domains if prompted.

## How it stores flights

Each saved flight is one Firestore document under `users/{yourUid}/flights/`,
holding the raw CSV text plus name, slope, row count, and timestamp. The rules
above ensure only you can read or write your own flights. Logs must be under
~900 KB (a normal flight is far smaller); larger ones would need Cloud Storage.
