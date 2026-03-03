interface Props {
  minDz: number;
  maxDz: number;
}

export default function ColorLegend({ minDz, maxDz }: Props) {
  return (
    <div className="color-legend">
      <h4>Elevation Change (m)</h4>
      <div className="legend-bar">
        <div className="gradient-bar" />
        <div className="legend-labels">
          <span>{maxDz.toFixed(1)}</span>
          <span>0.0</span>
          <span>{minDz.toFixed(1)}</span>
        </div>
      </div>
      <div className="legend-desc">
        <span className="fill-label">Fill (red)</span>
        <span className="cut-label">Cut (blue)</span>
      </div>
    </div>
  );
}
