import { ToolMode } from '../types';

interface Props {
  toolMode: ToolMode;
  onChange: (mode: ToolMode) => void;
  onScreenshot?: () => void;
}

export default function ViewerToolbar({ toolMode, onChange, onScreenshot }: Props) {
  return (
    <div className="viewer-toolbar">
      <button
        className={`tool-btn ${toolMode === 'orbit' ? 'active' : ''}`}
        onClick={() => onChange('orbit')}
        title="Orbit (drag to rotate)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="5.5" />
          <path d="M2.5 8c0-1.2 2.5-2.2 5.5-2.2s5.5 1 5.5 2.2" />
          <path d="M8 2.5c1.2 0 2.2 2.5 2.2 5.5s-1 5.5-2.2 5.5" />
        </svg>
      </button>
      <button
        className={`tool-btn ${toolMode === 'measure' ? 'active' : ''}`}
        onClick={() => onChange('measure')}
        title="Measure (click two points)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="2" y1="14" x2="14" y2="2" />
          <line x1="2" y1="14" x2="2" y2="10" />
          <line x1="2" y1="14" x2="6" y2="14" />
          <line x1="14" y1="2" x2="14" y2="6" />
          <line x1="14" y1="2" x2="10" y2="2" />
        </svg>
      </button>
      <button
        className={`tool-btn ${toolMode === 'cross-section' ? 'active' : ''}`}
        onClick={() => onChange('cross-section')}
        title="Cross-section (click two points to draw profile)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12L6 4L10 9L14 3" />
          <line x1="2" y1="14" x2="14" y2="14" />
        </svg>
      </button>
      <div className="toolbar-divider" />
      <button
        className="tool-btn"
        onClick={onScreenshot}
        title="Screenshot (download PNG)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="12" height="9" rx="1.5" />
          <circle cx="8" cy="9" r="2.5" />
          <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
        </svg>
      </button>
    </div>
  );
}
