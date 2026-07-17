import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { AuthModal } from '../components/AuthModal';
import { CDIPreview } from '../components/CDIPreview';

const GLIDESLOPE_LUA_PATH = `${import.meta.env.BASE_URL}glideslope.lua`;

export function Landing() {
  const { user, initializing } = useAuth();
  const navigate = useNavigate();
  const [pendingAction, setPendingAction] = useState<'download' | 'analyzer' | null>(null);
  const modalOpen = pendingAction !== null;

  function gate(action: 'download' | 'analyzer', e: React.MouseEvent) {
    if (user) return;
    e.preventDefault();
    // Auth state isn't resolved yet — we don't actually know if they're
    // signed in, so don't flash the sign-in gate open; just ignore the click.
    if (initializing) return;
    setPendingAction(action);
  }

  function closeModal() {
    setPendingAction(null);
  }

  // Once signed in, complete whatever action opened the modal.
  useEffect(() => {
    if (!user || !pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'analyzer') navigate('/analyzer');
    else if (action === 'download') {
      const a = document.createElement('a');
      a.href = GLIDESLOPE_LUA_PATH;
      a.download = '';
      a.click();
    }
  }, [user, pendingAction, navigate]);

  return (
    <div className="wrap">
      <Header subtitle="Toolkit" />

      <section className="hero">
        <div className="heroText">
          <h2>
            Fly a stabilized approach in the sim or in the field, then see exactly how you flew it.
          </h2>
          <p>
            An EdgeTX Lua script that shows live ILS-style needles and logs every approach to your
            SD card, paired with a browser analyzer that turns those logs into flight profiles,
            localizer tracks, and a replay of the CDI.
          </p>

          <div className="cta">
            <a className="btn" href={GLIDESLOPE_LUA_PATH} download onClick={(e) => gate('download', e)}>
              Download glideslope.lua <small>EdgeTX Tools script</small>
            </a>
            <a className="btn ghost" href="#/analyzer" onClick={(e) => gate('analyzer', e)}>
              Open the Analyzer
            </a>
          </div>
        </div>

        <div className="heroPreviewWrap">
          <CDIPreview />
        </div>
      </section>

      <div className="steps">
        <div className="step">
          <div className="n">01 — Install</div>
          <h3>Copy the script to your radio</h3>
          <p>
            Drop <span className="mono">glideslope.lua</span> into{' '}
            <span className="mono">/SCRIPTS/TOOLS/</span> on your EdgeTX radio's SD card.
          </p>
        </div>
        <div className="step">
          <div className="n">02 — Fly</div>
          <h3>Launch and log</h3>
          <p>
            Stand at your launch/landing spot, open the tool from SYS → Tools. Climb-out into
            wind locks the heading; flip the SD switch down on final for live ILS needles.
          </p>
        </div>
        <div className="step">
          <div className="n">03 — Review</div>
          <h3>Upload the log</h3>
          <p>
            Pull the <span className="mono">glideslope_*.csv</span> off the SD card and drop it
            into the Analyzer to see the approach broken down.
          </p>
        </div>
      </div>

      <div className="card card--info">
        <h3>Field sequence</h3>
        <p>1. Radio on, battery in, wait for sats. Arm.</p>
        <p>
          2. Standing at your launch/landing spot: <code>SYS → Tools → glideslope</code>. Confirm
          "LOG" is climbing.
        </p>
        <p>3. Launch into wind (SD switch up). Climb-out auto-locks heading.</p>
        <p>4. Fly. On final, flip SD switch down for ILS needles. Center them, land.</p>
        <p>5. RTN → read the save confirmation → RTN. Disarm separately.</p>
      </div>

      <div className="card card--info">
        <h3>Bench test mode</h3>
        <p>
          No groundspeed needed. Press ENTER (roller click) to lock heading to the plane's
          current direction and show the ILS immediately — "TEST" appears on screen. Physically
          move the plane to watch the needles swing. Press ENTER again to re-grab heading.
        </p>
      </div>

      <footer className="mono">
        Everything runs client-side. Logs stay on your device unless you sign in and choose to
        save one.
      </footer>

      <AuthModal
        open={modalOpen}
        onClose={closeModal}
        note="Sign in to download the script and open the analyzer."
      />
    </div>
  );
}
