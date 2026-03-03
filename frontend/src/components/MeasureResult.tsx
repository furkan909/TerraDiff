import { Measurement } from '../types';

interface Props {
  measurement: Measurement;
  onClear: () => void;
}

export default function MeasureResult({ measurement, onClear }: Props) {
  return (
    <section className="stats-section">
      <div className="measure-header">
        <h3 className="section-label">Measurement</h3>
        <button className="measure-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="stat-card">
        <div className="stat-row">
          <span className="stat-label">3D Distance</span>
          <span className="stat-value accent">
            {measurement.distance3D.toFixed(3)} m
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">XY Distance</span>
          <span className="stat-value">{measurement.distanceXY.toFixed(3)} m</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">dZ</span>
          <span className="stat-value">{measurement.dz.toFixed(3)} m</span>
        </div>
      </div>
    </section>
  );
}
