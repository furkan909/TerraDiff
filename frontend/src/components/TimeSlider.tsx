import { ViewMode } from '../types';

interface Props {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const modes: { value: ViewMode; label: string; shortLabel: string }[] = [
  { value: 'epoch1', label: 'Before', shortLabel: 'T1' },
  { value: 'epoch2', label: 'After', shortLabel: 'T2' },
  { value: 'diff', label: 'Change', shortLabel: 'dZ' },
];

export default function TimeSlider({ viewMode, onChange }: Props) {
  return (
    <div className="time-slider">
      {modes.map((m) => (
        <button
          key={m.value}
          className={`mode-btn ${viewMode === m.value ? 'active' : ''}`}
          onClick={() => onChange(m.value)}
        >
          <span className="mode-short">{m.shortLabel}</span>
          <span className="mode-label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
