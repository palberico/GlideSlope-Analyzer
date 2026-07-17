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
          assigned to <code>sd</code> to toggle the ILS display. Home position, heading lock, and
          the target glideslope angle are all handled automatically or from the radio itself — no
          setup screen.
        </p>
      </div>

      <div className="card card--info">
        <h3>3. Starting a flight</h3>
        <p>Radio on, battery in, wait for a GPS fix. Arm.</p>
        <p>
          Stand exactly where you'll launch and land, then open <code>SYS → Tools → glideslope</code>{' '}
          — the tool grabs that spot as home the instant it gets a GPS fix, confirmed with a beep
          and a climbing <code>LOG</code> counter in the corner.
        </p>
        <p>
          Launch into wind. Once you're climbing above roughly 10 km/h groundspeed, the tool locks
          your heading (another beep) — that becomes the extended runway centerline the CDI
          measures against for the rest of the flight.
        </p>
      </div>

      <div className="card card--info">
        <h3>4. Bench testing without flying</h3>
        <p>
          No groundspeed needed to try it out on the bench. Press <code>ENTER</code> (roller
          click) to lock the heading to wherever the plane is currently pointed and show the ILS
          immediately — <code>TEST</code> appears in the corner. Physically turn or move the plane
          to watch the needles swing. Press <code>ENTER</code> again any time to re-grab the
          current heading.
        </p>
      </div>

      <div className="card card--info">
        <h3>5. Flying the approach</h3>
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
        <h3>6. Reading the CDI</h3>
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
        <h3>7. Ending the flight</h3>
        <p>
          Press <code>RTN</code> to stop logging and save. The tool re-opens the file to verify
          it's actually on the card and shows <code>LOG SAVED</code> (or <code>SAVE FAILED</code>{' '}
          if something went wrong, so you know to check the card before you pack up). Press{' '}
          <code>RTN</code> or <code>ENTER</code> again to exit. Disarm separately — exiting the
          tool doesn't disarm the model.
        </p>
      </div>

      <div className="card card--info">
        <h3>8. Reviewing a flight in the Analyzer</h3>
        <p>
          Pull the <code>glideslope_*.csv</code> file off the SD card — from <code>/LOGS/</code>,
          or the card's root if that folder didn't exist — and drop it into the Analyzer. It
          automatically detects individual approaches within the log and selects the most recent
          one, or you can switch to "Whole flight" to see everything at once.
        </p>
      </div>

      <div className="card card--info">
        <h3>9. Understanding the charts</h3>
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
        <h3>10. Saving flights to your account</h3>
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
