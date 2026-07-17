import { useEffect } from 'react';
import type { Flight } from '../hooks/useFlights';
import { FlightList } from './FlightList';

interface SavedFlightsModalProps {
  open: boolean;
  onClose: () => void;
  flights: Flight[] | null;
  error: string;
  onOpen: (csv: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function SavedFlightsModal({ open, onClose, flights, error, onOpen, onDelete }: SavedFlightsModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`modal-backdrop${open ? '' : ' hidden'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flights-modal">
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          &times;
        </button>
        <FlightList flights={flights} error={error} onOpen={onOpen} onDelete={onDelete} />
      </div>
    </div>
  );
}
