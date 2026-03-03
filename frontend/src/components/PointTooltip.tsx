import { PickedPoint } from '../types';

interface Props {
  point: PickedPoint;
  onClose: () => void;
}

export default function PointTooltip({ point, onClose }: Props) {
  return (
    <div
      className="point-tooltip"
      style={{
        left: point.screenX + 12,
        top: point.screenY - 40,
      }}
    >
      <button className="tooltip-close" onClick={onClose}>
        &times;
      </button>
      <div className="tooltip-row">
        <span className="tooltip-label">X</span>
        <span className="tooltip-value">{point.x.toFixed(3)}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Y</span>
        <span className="tooltip-value">{point.y.toFixed(3)}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Z</span>
        <span className="tooltip-value">{point.z.toFixed(3)}</span>
      </div>
    </div>
  );
}
