import type { Flight } from '../hooks/useFlights';

interface FlightListProps {
  flights: Flight[] | null;
  error: string;
  onOpen: (csv: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function FlightList({ flights, error, onOpen, onDelete }: FlightListProps) {
  return (
    <section className="flights">
      <h3>My saved flights</h3>
      <div>
        {error ? (
          <div className="fl-empty">Error: {error}</div>
        ) : flights === null ? (
          <div className="fl-empty">Loading…</div>
        ) : flights.length === 0 ? (
          <div className="fl-empty">No saved flights yet — upload a log and press Save flight.</div>
        ) : (
          flights.map((f) => {
            const when = f.createdAt ? f.createdAt.toDate().toLocaleString() : '';
            return (
              <div className="fl-item" key={f.id}>
                <div className="fl-meta">
                  <b>{f.name || 'flight'}</b>
                  <span>
                    {when}
                    {f.slope ? ` · ${f.slope.toFixed(1)}°` : ''}
                    {f.rows ? ` · ${f.rows} rows` : ''}
                  </span>
                </div>
                <button className="ghost" onClick={() => onOpen(f.csv, f.name || 'flight')}>
                  Open
                </button>
                <button
                  className="ghost"
                  onClick={() => {
                    if (confirm(`Delete "${f.name || 'flight'}"?`)) onDelete(f.id, f.name || 'flight');
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
