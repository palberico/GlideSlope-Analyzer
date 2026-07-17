# Ideas backlog

Suggestions from a 2026-07-17 conversation with Claude, kept here as a
reference for later — nothing here is committed or scheduled.

## Feature ideas

### glideslope.lua

- **Audio glideslope tone.** A continuous tone whose pitch (or beep rate)
  tracks vertical deviation — rising when high, falling when low, steady on
  slope — the way a real VASI/audio-ILS aid works. Lets you fly heads-up
  watching the aircraft instead of the radio screen. `playTone` supports
  variable pitch, so this is buildable without new sensors.
- **Live end-of-approach verdict + go-around callout.** The instant `dist`
  crosses through the target, flash a quick score on screen (same idea as
  `StatsPanel`'s after-the-fact verdict in the app) — and if still well off
  slope/course at that moment, flash "GO AROUND" instead. Immediate in-field
  feedback without pulling the log later.
- **Adjustable full-scale sensitivity.** `LAT_FS`/`VERT_FS` (needle
  deflection scale) are hardcoded constants. Making them an in-flight
  setting (same roller-wheel pattern as slope) would let the same script
  serve a beginner who wants generous tolerance and an advanced pilot
  dialing in tight precision.

### Analyzer app

- **Flight comparison / overlay.** Pick two or more saved flights and see
  their vertical profiles and stats side by side, or superimposed on one
  chart. Biggest "am I actually getting better?" feature for repeated
  training use.
- **Progress dashboard.** Across all saved flights: a trend line of RMS
  vertical/lateral error over time, personal bests. Turns the app from a
  single-flight viewer into a training tracker — the data's already in
  Firestore.
- **"Ghost" CDI replay.** Replay a flight with a second, translucent needle
  overlaid showing how a reference flight (personal best, or any saved one)
  tracked at the same distance-to-go — a ghost lap, essentially.
  `CDIReplay` already has the plumbing to extend this way.
- **Shareable read-only flight link.** A public link to one saved flight's
  replay/charts for showing an instructor or club without them needing an
  account.

## Improvements / fixes

### glideslope.lua

- **Outlier rejection in the heading debounce.** The 400ms auto-lock window
  circular-averages every `Hdg` sample equally. Discarding samples too far
  from the cluster median before averaging would make the lock more robust
  against a throw that's still settling.
- **Log `mode` (auto/manual) as a CSV column.** Without it, telling which
  mode produced a given log requires manual reconstruction after the fact.
  One column, trivial cost.
- **Require a minimum sat count before accepting home.** Home is captured on
  the first non-null GPS fix, which could be a marginal one. Gating on e.g.
  `Sats >= 6` avoids anchoring the flight to a low-quality fix.
- **Show live `Hdg` while waiting for auto-lock**, so it's visible before/as
  it settles instead of being invisible until the lock fires.

### Analyzer app

- **Code-split Leaflet and Firebase.** Bundle grew from 888KB to 1.1MB
  (minified) after adding the map, both past Vite's 500KB warning. Dynamic
  `import()` for the map and auth/Firestore modules would cut initial load
  for visits that don't need them immediately.
- **Add a real test suite (Vitest) for `csv.ts`/`geo.ts`.** That logic has
  been hand-verified with throwaway scripts three times this session already
  — a persisted suite would catch regressions automatically instead of that
  verification evaporating after each change.
- **Error boundary around the chart/map section.** A malformed CSV or a map
  rendering hiccup currently has no fallback — white-screens the whole app
  rather than degrading gracefully.
- **Compress saved-flight CSVs before writing to Firestore.** The row schema
  just grew (lat/lon/hdg/home columns), pushing logs closer to the 900KB cap
  sooner than before. gzip+base64 would buy real headroom.
- **Surface flight mode in the UI** once it's logged (pairs with the Lua-side
  `mode` column idea above).
