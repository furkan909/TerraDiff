import { JobStats, ViewMode } from '../types';

interface Props {
  stats: JobStats;
  viewMode: ViewMode;
}

/** Format a dZ value with appropriate precision based on magnitude. */
function fmtDz(v: number): string {
  const abs = Math.abs(v);
  if (abs < 0.01) return v.toFixed(4);
  if (abs < 1) return v.toFixed(3);
  return v.toFixed(2);
}

/** Format a volume value with appropriate precision and unit. */
function fmtVol(v: number): string {
  const abs = Math.abs(v);
  if (abs < 0.01) return v.toFixed(4);
  if (abs < 1) return v.toFixed(3);
  if (abs < 100) return v.toFixed(2);
  return v.toFixed(1);
}

export default function StatsPanel({ stats, viewMode }: Props) {
  const crMin = stats.color_range_min;
  const crMax = stats.color_range_max;

  return (
    <div className="stats-panel">
      {/* Registration quality */}
      <section className="stats-section">
        <h3 className="section-label">Registration</h3>
        <div className="stat-card">
          <div className="stat-row">
            <span className="stat-label">RMSE</span>
            <span className="stat-value">{stats.icp_rmse.toFixed(4)} m</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Fitness</span>
            <span className="stat-value accent">{(stats.icp_fitness * 100).toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* Elevation changes — only when viewing diff */}
      {viewMode === 'diff' && (
        <section className="stats-section">
          <h3 className="section-label">Elevation Change</h3>

          {/* Hero: raw extremes */}
          <div className="dz-summary">
            <div className="dz-hero">
              <div className="dz-hero-item cut">
                <span className="dz-hero-value">{stats.min_dz.toFixed(2)}</span>
                <span className="dz-hero-unit">m min</span>
              </div>
              <div className="dz-hero-divider" />
              <div className="dz-hero-item fill">
                <span className="dz-hero-value">+{stats.max_dz.toFixed(2)}</span>
                <span className="dz-hero-unit">m max</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-row">
              <span className="stat-label">Mean dZ</span>
              <span className="stat-value">{stats.mean_dz.toFixed(3)} m</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Std. Dev.</span>
              <span className="stat-value">{stats.std_dz.toFixed(3)} m</span>
            </div>
          </div>

          {/* Color legend — shows the clamped range used for coloring */}
          <div className="inline-legend">
            <span className="legend-title">Color mapping (2nd–98th percentile)</span>
            <div className="legend-gradient" />
            <div className="legend-range">
              <span className="cut-text">{fmtDz(crMin)} m</span>
              <span className="neutral-text">0</span>
              <span className="fill-text">+{fmtDz(crMax)} m</span>
            </div>
          </div>
        </section>
      )}

      {/* Volume — only when viewing diff and volume data is available */}
      {viewMode === 'diff' && stats.cut_volume != null && (
        <section className="stats-section">
          <h3 className="section-label">Volume</h3>

          <div className="dz-summary">
            <div className="dz-hero">
              <div className="dz-hero-item cut">
                <span className="dz-hero-value">{fmtVol(stats.cut_volume)}</span>
                <span className="dz-hero-unit">m³ cut</span>
              </div>
              <div className="dz-hero-divider" />
              <div className="dz-hero-item fill">
                <span className="dz-hero-value">{fmtVol(stats.fill_volume)}</span>
                <span className="dz-hero-unit">m³ fill</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-row">
              <span className="stat-label">Net Volume</span>
              <span className="stat-value">{stats.net_volume >= 0 ? '+' : ''}{fmtVol(stats.net_volume)} m³</span>
            </div>
          </div>
        </section>
      )}

      {/* Point counts */}
      <section className="stats-section">
        <h3 className="section-label">Point Clouds</h3>
        <div className="stat-card">
          <div className="stat-row">
            <span className="stat-label">Epoch 1</span>
            <span className="stat-value mono">{stats.epoch1_count.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Epoch 2</span>
            <span className="stat-value mono">{stats.epoch2_count.toLocaleString()}</span>
          </div>
          {viewMode === 'diff' && (
            <div className="stat-row">
              <span className="stat-label">Diff Grid</span>
              <span className="stat-value mono">{stats.diff_count.toLocaleString()}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
