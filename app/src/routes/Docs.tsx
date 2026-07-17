import { Header } from '../components/Header';

export function Docs() {
  return (
    <div className="wrap">
      <Header subtitle="Docs" linkToHome />

      <section className="docsIntro">
        <h2>How Approach Review works</h2>
        <p>
          Approach Review is two pieces: <strong>glideslope.lua</strong> is an EdgeTX Tools script
          that shows live ILS-style CDI needles on your radio during a stabilized approach and
          logs every approach to your SD card. The <strong>Analyzer</strong> — this site — turns
          those logs into flight profiles, localizer tracks, and a full CDI replay you can review
          afterward. Everything runs client-side; nothing is uploaded unless you sign in and
          choose to save a flight.
        </p>
      </section>

      <div className="card card--info">
        <h3>1. Download &amp; install</h3>
        <p>
          Sign in on the home page and click <code>Download glideslope.lua</code>. Copy the file
          to <code>/SCRIPTS/TOOLS/</code> on your EdgeTX radio's SD card — it'll then show up
          under <code>SYS → Tools → glideslope</code>.
        </p>
      </div>

      <div className="card card--info">
        <h3>2. What the script needs</h3>
        <p>
          GPS, altitude, heading, and groundspeed telemetry sensors, plus a two-position switch
          assigned to <code>sd</code> to toggle the ILS display. Home position is captured
          automatically; the heading lock is either automatic (from GPS) or set by hand on the
          setup screen that opens with the tool — see below. The target glideslope angle is
          adjustable in flight from the radio's roller wheel.
        </p>
      </div>

      <div className="card card--info">
        <h3>3. Automatic vs. manual heading</h3>
        <p>
          Opening the tool shows a setup screen: scroll the wheel to choose{' '}
          <code>AUTOMATIC</code> or <code>MANUAL</code>, then press <code>ENTER</code> to confirm.
        </p>
        <p>
          <strong>Automatic</strong> locks the heading from GPS once you're climbing above roughly
          10 km/h groundspeed, sustained for a short moment — best for wheeled takeoffs, where
          groundspeed ramps up smoothly down a runway.
        </p>
        <p>
          <strong>Manual</strong> lets you dial in the runway/launch heading yourself, in 5°
          steps with a compass-point label (N, NE, E…), before you fly — press{' '}
          <code>ENTER</code> to confirm and start. Use this for hand launches: a hard throw can
          spike groundspeed past the automatic lock threshold before GPS has a chance to settle on
          a real course, so automatic mode can end up locking onto noise from the throw itself
          rather than your actual flight path. Your last manual heading is remembered next time
          you open the tool.
        </p>
        <p>Either way, home position — the spot where you opened the tool — is still captured automatically off the first GPS fix.</p>
      </div>

      <div className="card card--info">
        <h3>4. Starting a flight</h3>
        <p>Radio on, battery in, wait for a GPS fix. Arm.</p>
        <p>
          Open <code>SYS → Tools → glideslope</code> and choose automatic or manual heading (see
          above). Stand exactly where you'll launch and land — the tool grabs that spot as home
          the instant it gets a GPS fix, confirmed with a beep and a climbing <code>LOG</code>{' '}
          counter in the corner.
        </p>
        <p>
          Launch into wind. In automatic mode, once you're climbing above roughly 10 km/h
          groundspeed the tool locks your heading (another beep) — that becomes the extended
          runway centerline the CDI measures against for the rest of the flight. In manual mode
          the heading is already set, so there's nothing to wait for.
        </p>
      </div>

      <div className="card card--info">
        <h3>5. Bench testing without flying</h3>
        <p>
          Automatic mode only. No groundspeed needed to try it out on the bench. Press{' '}
          <code>ENTER</code> (roller click) to lock the heading to wherever the plane is currently
          pointed and show the ILS immediately — <code>TEST</code> appears in the corner.
          Physically turn or move the plane to watch the needles swing. Press <code>ENTER</code>{' '}
          again any time to re-grab the current heading. (In manual mode your heading is already
          fixed, so <code>ENTER</code> doesn't do anything on the flight screen — it can't
          silently override what you dialed in.)
        </p>
      </div>

      <div className="card card--info">
        <h3>6. Flying the approach</h3>
        <p>
          On final, flip the SD switch down — the CDI needles appear along with live readouts for
          distance, lateral deviation, vertical deviation, and altitude. Center both needles and
          land.
        </p>
        <p>
          The roller wheel adjusts the target glideslope angle in flight, from 2° to 8° in 0.5°
          steps. It's saved on the model and remembered next time you open the tool.
        </p>
      </div>

      <div className="card card--info">
        <h3>7. Reading the CDI</h3>
        <p>The needles work like a real ILS: fly toward the needle to get back on path.</p>
        <p>
          The vertical needle shows lateral deviation — if it's left of center, you're right of
          the extended centerline, so turn left. The horizontal needle shows vertical deviation —
          if it's below center, you're above the glideslope, so descend.
        </p>
        <p>
          The small center square is a fixed aircraft reference; the needles move around it. Full
          deflection is about 40 m off centerline laterally, or 20 m off the glideslope vertically
          — the dotted tick marks along each axis are reference points in between, so you can judge
          how far off you are at a glance.
        </p>
      </div>

      <div className="card card--info">
        <h3>8. Ending the flight</h3>
        <p>
          Press <code>RTN</code> to stop logging and save. The tool re-opens the file to verify
          it's actually on the card and shows <code>LOG SAVED</code> (or <code>SAVE FAILED</code>{' '}
          if something went wrong, so you know to check the card before you pack up). Press{' '}
          <code>RTN</code> or <code>ENTER</code> again to exit. Disarm separately — exiting the
          tool doesn't disarm the model.
        </p>
      </div>

      <div className="card card--info">
        <h3>9. Reviewing a flight in the Analyzer</h3>
        <p>
          Pull the <code>glideslope_*.csv</code> file off the SD card — from <code>/LOGS/</code>,
          or the card's root if that folder didn't exist — and drop it into the Analyzer. It
          automatically detects individual approaches within the log and selects the most recent
          one, or you can switch to "Whole flight" to see everything at once.
        </p>
      </div>

      <div className="card card--info">
        <h3>10. Understanding the charts</h3>
        <p>
          <strong>Approach replay</strong> is the same CDI you saw on the radio, with play and
          scrub controls to fly it back at up to 4×.
        </p>
        <p>
          <strong>Vertical profile</strong> plots your altitude against the ideal glideslope,
          colored by whether you were high or low. <strong>Localizer</strong> is the top-down
          ground track against the extended centerline. <strong>Deviation to go</strong> plots
          lateral and vertical error against distance remaining.
        </p>
        <p>
          <strong>Approach numbers</strong> gives you RMS and peak deviation stats, plus a
          plain-language read on how the last 30 m of the approach went.
        </p>
      </div>

      <div className="card card--info">
        <h3>11. Saving flights to your account</h3>
        <p>
          Sign in with Google or email to save flights — press <code>Save flight</code> after
          loading a log. Open the account menu (top right) → <code>My saved flights</code> to
          browse, reopen, or delete anything you've saved. Logs need to be under about 900 KB; a
          typical flight is far smaller.
        </p>
      </div>
    </div>
  );
}
