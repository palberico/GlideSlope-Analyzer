import { useRef, useState } from 'react';

interface DropZoneProps {
  /** Parses and loads the CSV text; throw to surface a message in the drop zone. */
  onFile: (text: string, name: string) => void;
}

export function DropZone({ onFile }: DropZoneProps) {
  const [hot, setHot] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        onFile(rd.result as string, f.name);
        setError('');
      } catch (e) {
        setError((e as Error).message);
      }
    };
    rd.onerror = () => setError("Couldn't read that file.");
    rd.readAsText(f);
  }

  return (
    <section>
      <div
        className={`drop${hot ? ' hot' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setHot(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setHot(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setHot(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setHot(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <h2>Drop a flight log</h2>
        <p>
          Drag a <span className="mono">glideslope_*.csv</span> here, or{' '}
          <span className="browse" onClick={() => fileInputRef.current?.click()}>
            browse
          </span>
          .
        </p>
        <p style={{ color: 'var(--faint)' }}>Everything runs in your browser. Nothing is uploaded.</p>
        {error && <div className="err">{error}</div>}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </section>
  );
}
