import { useEffect, useRef } from 'react';

interface Props {
  dzValues: Float32Array;
  colorRangeMin: number;
  colorRangeMax: number;
}

const WIDTH = 280;
const HEIGHT = 140;
const PAD = { top: 12, right: 12, bottom: 28, left: 40 };
const NUM_BINS = 40;
const BG = '#141417';
const CUT_COLOR = '#317cb7';
const FILL_COLOR = '#c33b3b';
const GRID_COLOR = 'rgba(255,255,255,0.06)';
const TEXT_COLOR = 'rgba(255,255,255,0.4)';

export default function DzHistogram({ dzValues, colorRangeMin, colorRangeMax }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dzValues.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Compute histogram bins
    let minVal = Infinity, maxVal = -Infinity;
    for (let i = 0; i < dzValues.length; i++) {
      if (dzValues[i] < minVal) minVal = dzValues[i];
      if (dzValues[i] > maxVal) maxVal = dzValues[i];
    }
    const range = maxVal - minVal || 1;
    const binWidth = range / NUM_BINS;
    const bins = new Uint32Array(NUM_BINS);

    for (let i = 0; i < dzValues.length; i++) {
      let bin = Math.floor((dzValues[i] - minVal) / binWidth);
      if (bin >= NUM_BINS) bin = NUM_BINS - 1;
      bins[bin]++;
    }

    let maxCount = 0;
    for (let i = 0; i < NUM_BINS; i++) {
      if (bins[i] > maxCount) maxCount = bins[i];
    }
    if (maxCount === 0) maxCount = 1;

    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const barW = plotW / NUM_BINS;

    // Clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Gridlines (3 horizontal)
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = PAD.top + plotH * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();
    }

    // Bars
    for (let i = 0; i < NUM_BINS; i++) {
      const binCenter = minVal + (i + 0.5) * binWidth;
      ctx.fillStyle = binCenter < 0 ? CUT_COLOR : FILL_COLOR;
      const barH = (bins[i] / maxCount) * plotH;
      const x = PAD.left + i * barW;
      const y = PAD.top + plotH - barH;
      ctx.fillRect(x + 0.5, y, barW - 1, barH);
    }

    // Zero line (dashed)
    const zeroFrac = (0 - minVal) / range;
    if (zeroFrac > 0 && zeroFrac < 1) {
      const zeroX = PAD.left + zeroFrac * plotW;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(zeroX, PAD.top);
      ctx.lineTo(zeroX, PAD.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // X-axis labels
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(minVal.toFixed(1), PAD.left, HEIGHT - 6);
    ctx.textAlign = 'right';
    ctx.fillText(maxVal.toFixed(1), PAD.left + plotW, HEIGHT - 6);
    ctx.textAlign = 'center';
    ctx.fillText('dZ (m)', PAD.left + plotW / 2, HEIGHT - 6);

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('0', PAD.left - 4, PAD.top + plotH);
    ctx.fillText(maxCount.toLocaleString(), PAD.left - 4, PAD.top);
  }, [dzValues, colorRangeMin, colorRangeMax]);

  return (
    <div className="histogram-container">
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT, display: 'block', borderRadius: 6 }}
      />
    </div>
  );
}
