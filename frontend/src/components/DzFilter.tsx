import { useState, useEffect } from 'react';
import { PointCloudData } from '../types';

interface Props {
  fullData: PointCloudData;
  onFilter: (filtered: PointCloudData) => void;
  minDz: number;
  maxDz: number;
}

type FilterMode = 'all' | 'cut' | 'fill';

export default function DzFilter({ fullData, onFilter, minDz, maxDz }: Props) {
  const [mode, setMode] = useState<FilterMode>('all');
  const dzValues = fullData.dzValues;

  const handleMode = (newMode: FilterMode) => {
    setMode(newMode);

    if (!dzValues || newMode === 'all') {
      onFilter(fullData);
      return;
    }

    const lo = newMode === 'cut' ? minDz : 0.001;
    const hi = newMode === 'fill' ? maxDz : -0.001;

    const indices: number[] = [];
    for (let i = 0; i < fullData.numPoints; i++) {
      const dz = dzValues[i];
      if (dz >= lo && dz <= hi) indices.push(i);
    }

    const n = indices.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const newDz = new Float32Array(n);

    for (let j = 0; j < n; j++) {
      const i = indices[j];
      positions[j * 3] = fullData.positions[i * 3];
      positions[j * 3 + 1] = fullData.positions[i * 3 + 1];
      positions[j * 3 + 2] = fullData.positions[i * 3 + 2];
      colors[j * 3] = fullData.colors[i * 3];
      colors[j * 3 + 1] = fullData.colors[i * 3 + 1];
      colors[j * 3 + 2] = fullData.colors[i * 3 + 2];
      newDz[j] = dzValues[i];
    }

    onFilter({ positions, colors, numPoints: n, dzValues: newDz });
  };

  return (
    <section className="stats-section">
      <h3 className="section-label">Filter</h3>
      <div className="filter-segmented">
        {(['all', 'cut', 'fill'] as FilterMode[]).map((m) => (
          <button
            key={m}
            className={`filter-seg-btn ${mode === m ? 'active' : ''} ${m !== 'all' ? m : ''}`}
            onClick={() => handleMode(m)}
          >
            {m === 'all' ? 'All' : m === 'cut' ? 'Cut' : 'Fill'}
          </button>
        ))}
      </div>
    </section>
  );
}
