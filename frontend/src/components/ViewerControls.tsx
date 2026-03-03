import { ViewerSettings } from '../types';

interface Props {
  settings: ViewerSettings;
  onChange: (settings: ViewerSettings) => void;
}

const DEFAULTS: ViewerSettings = { pointSize: 1.5, opacity: 1.0, showContours: false };

export default function ViewerControls({ settings, onChange }: Props) {
  const isDefault =
    settings.pointSize === DEFAULTS.pointSize &&
    settings.opacity === DEFAULTS.opacity &&
    settings.showContours === DEFAULTS.showContours;

  return (
    <section className="stats-section">
      <div className="measure-header">
        <h3 className="section-label">Display</h3>
        {!isDefault && (
          <button className="measure-clear" onClick={() => onChange(DEFAULTS)}>
            Reset
          </button>
        )}
      </div>
      <div className="control-group">
        <div className="control-row">
          <label className="control-label">Point Size</label>
          <span className="control-value">{settings.pointSize.toFixed(1)}</span>
        </div>
        <input
          type="range"
          className="control-slider"
          min="0.1"
          max="5.0"
          step="0.1"
          value={settings.pointSize}
          onChange={(e) =>
            onChange({ ...settings, pointSize: parseFloat(e.target.value) })
          }
        />
      </div>
      <div className="control-group">
        <div className="control-row">
          <label className="control-label">Opacity</label>
          <span className="control-value">{Math.round(settings.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          className="control-slider"
          min="0.1"
          max="1.0"
          step="0.05"
          value={settings.opacity}
          onChange={(e) =>
            onChange({ ...settings, opacity: parseFloat(e.target.value) })
          }
        />
      </div>
      <div className="control-group">
        <div className="control-row">
          <label className="control-label">Contours</label>
          <button
            className={`contour-toggle ${settings.showContours ? 'on' : ''}`}
            onClick={() => onChange({ ...settings, showContours: !settings.showContours })}
            role="switch"
            aria-checked={settings.showContours}
          >
            <span className="contour-toggle-knob" />
          </button>
        </div>
      </div>
    </section>
  );
}
