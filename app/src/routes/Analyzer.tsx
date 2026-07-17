import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFlights } from '../hooks/useFlights';
import { Header } from '../components/Header';
import { AuthModal } from '../components/AuthModal';
import { SavedFlightsModal } from '../components/SavedFlightsModal';
import { DropZone } from '../components/DropZone';
import { SummaryStrip } from '../components/SummaryStrip';
import { ProfileChart } from '../components/ProfileChart';
import { LocalizerMap } from '../components/LocalizerMap';
import { DevChart } from '../components/DevChart';
import { CDIReplay } from '../components/CDIReplay';
import { StatsPanel } from '../components/StatsPanel';
import {
  parseCSV,
  validRows,
  deriveSlope,
  deriveHome,
  detectApproaches,
  type Row,
  type Segment,
} from '../lib/csv';

const MAX_CSV_BYTES = 900000;

export function Analyzer() {
  const { user, initializing } = useAuth();
  const { flights, error: flightsError, save, remove } = useFlights(user);

  const [rows, setRows] = useState<Row[]>([]);
  const [approaches, setApproaches] = useState<Segment[]>([]);
  const [slope, setSlope] = useState(3);
  const [fileName, setFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | 'all'>('all');
  const [saveLabel, setSaveLabel] = useState('Save flight');
  const [savedFlightsOpen, setSavedFlightsOpen] = useState(false);

  const hasData = rows.length > 0;
  const home = useMemo(() => deriveHome(rows), [rows]);

  function load(text: string, name: string) {
    const parsed = parseCSV(text);
    const valid = validRows(parsed);
    if (!valid.length) {
      throw new Error(
        "No approach data in this log. Either the tool never locked a heading (on the bench: press ENTER for TEST mode, then move the plane; in flight: heading locks on into-wind climb-out), or the log is from a tool version that didn't record the computed columns — reflash glideslope.lua and re-log."
      );
    }
    const derivedSlope = deriveSlope(valid);
    const detected = detectApproaches(parsed);
    setRows(parsed);
    setApproaches(detected);
    setSlope(derivedSlope);
    setFileName(name);
    setCsvText(text);
    setSelectedIndex(detected.length ? detected.length - 1 : 'all');
  }

  function resetToDropzone() {
    setRows([]);
    setApproaches([]);
    setFileName('');
    setCsvText('');
  }

  function handleOpenFlight(csv: string, name: string) {
    try {
      load(csv, name);
      setSavedFlightsOpen(false);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleSave() {
    if (!user) {
      alert('Sign in to save.');
      return;
    }
    if (!csvText) {
      alert('Load a flight first.');
      return;
    }
    if (csvText.length > MAX_CSV_BYTES) {
      alert(
        'This log is over ~900KB — too large for a Firestore document. We can move CSV storage to Cloud Storage if you need bigger logs.'
      );
      return;
    }
    const name = prompt('Name this flight:', fileName || 'flight');
    if (name === null) return;
    try {
      await save(name, csvText, slope ?? null, rows.length ?? null);
      setSaveLabel('Saved ✓');
      setTimeout(() => setSaveLabel('Save flight'), 1500);
    } catch (e) {
      alert('Save failed: ' + (e as Error).message);
    }
  }

  // Memoized so chart/map components keyed on `segment` (identity) don't treat
  // an unrelated re-render (e.g. the save-button label ticking back) as new data.
  const currentSegment: Segment | null = useMemo(() => {
    if (!hasData) return null;
    return selectedIndex === 'all' ? { rows: validRows(rows) } : approaches[selectedIndex];
  }, [hasData, selectedIndex, rows, approaches]);

  const durationSec = hasData ? (rows[rows.length - 1].ms! - rows[0].ms!) / 1000 : 0;

  return (
    <>
      <div className="wrap">
        <Header subtitle="Analyzer" linkToHome onOpenSavedFlights={() => setSavedFlightsOpen(true)} />

        {hasData && (
          <header className="top">
            <span className="spacer" />
            <span className="file mono">{fileName}</span>
            <span className="reset" onClick={resetToDropzone}>
              load another
            </span>
          </header>
        )}

        {user && !hasData && <DropZone onFile={load} />}

        {user && hasData && currentSegment && (
          <section>
            <SummaryStrip
              rowCount={rows.length}
              durationSec={durationSec}
              slope={slope}
              approachCount={approaches.length}
            />

            <div className="controls">
              <label htmlFor="apSel">Approach</label>
              <select
                id="apSel"
                value={selectedIndex}
                onChange={(e) =>
                  setSelectedIndex(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                }
              >
                {approaches.length ? (
                  approaches.map((a, i) => (
                    <option value={i} key={i}>
                      #{i + 1} — {Math.max(...a.rows.map((r) => r.dist!)).toFixed(0)} m in
                    </option>
                  ))
                ) : (
                  <option value="all">Whole flight</option>
                )}
              </select>
              <button className="ghost" onClick={() => setSelectedIndex('all')}>
                Whole flight
              </button>
              <button className="btn" onClick={handleSave}>
                {saveLabel}
              </button>
            </div>

            <div className="grid">
              <div className="card">
                <h3>Approach replay</h3>
                <p className="note">
                  The CDI as it played on the radio — press play to fly the approach back.
                </p>
                <CDIReplay segment={currentSegment} />
              </div>

              <div className="card">
                <h3>Vertical profile</h3>
                <p className="note">Side view — flown height vs the ideal glideslope, target at right.</p>
                <ProfileChart segment={currentSegment} slope={slope} />
                <div className="legend">
                  <span>
                    <i style={{ background: 'var(--course)' }} />
                    Ideal slope
                  </span>
                  <span>
                    <i style={{ background: 'var(--track)' }} />
                    Flown
                  </span>
                  <span>
                    <i style={{ background: 'var(--high)' }} />
                    High
                  </span>
                  <span>
                    <i style={{ background: 'var(--low)' }} />
                    Low
                  </span>
                </div>
              </div>

              <div className="row2">
                <div className="card">
                  <h3>Localizer — top down</h3>
                  <p className="note">
                    Ground track vs the extended centerline, on an OpenStreetMap basemap centered
                    on home. North is up.
                  </p>
                  <LocalizerMap segment={currentSegment} home={home} />
                </div>
                <div className="card">
                  <h3>Deviation to go</h3>
                  <p className="note">Vertical &amp; lateral error as distance counts down.</p>
                  <DevChart segment={currentSegment} />
                  <div className="legend">
                    <span>
                      <i style={{ background: 'var(--course)' }} />
                      Vertical
                    </span>
                    <span>
                      <i style={{ background: 'var(--track)' }} />
                      Lateral
                    </span>
                  </div>
                </div>
              </div>

              <StatsPanel segment={currentSegment} slope={slope} />
            </div>
          </section>
        )}
      </div>

      <SavedFlightsModal
        open={savedFlightsOpen}
        onClose={() => setSavedFlightsOpen(false)}
        flights={flights}
        error={flightsError}
        onOpen={handleOpenFlight}
        onDelete={remove}
      />

      <AuthModal open={!initializing && !user} note="Sign in to use the analyzer and save flights." />
    </>
  );
}
