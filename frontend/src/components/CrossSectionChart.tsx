import { useEffect, useRef } from 'react';
import { CrossSectionData } from '../types';

interface Props {
  data: CrossSectionData;
}

const WIDTH = 280;
const HEIGHT = 180;
const PAD = { top: 12, right: 12, bottom: 28, left: 44 };
const BG = '#141417';
const GRID_COLOR = 'rgba(255,255,255,0.06)';
const TEXT_COLOR = 'rgba(255,255,255,0.4)';
const EPOCH1_COLOR = 'rgba(255,255,255,0.25)';
const EPOCH2_COLOR = '#5bb8a4';
const CUT_COLOR = 'rgba(49,124,183,0.3)';
const FILL_COLOR = 'rgba(195,59,59,0.3)';

export default function CrossSectionChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const { distances, z1, z2 } = data;
    if (distances.length === 0) return;

    // Filter out nulls — find valid range
    let minZ = Infinity, maxZ = -Infinity;
    let maxDist = 0;
    for (let i = 0; i < distances.length; i++) {
      if (z1[i] != null) { minZ = Math.min(minZ, z1[i]); maxZ = Math.max(maxZ, z1[i]); }
      if (z2[i] != null) { minZ = Math.min(minZ, z2[i]); maxZ = Math.max(maxZ, z2[i]); }
      maxDist = Math.max(maxDist, distances[i]);
    }

    if (!isFinite(minZ)) return;
    const zPad = (maxZ - minZ) * 0.1 || 1;
    minZ -= zPad;
    maxZ += zPad;

    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;

    const toX = (d: number) => PAD.left + (d / (maxDist || 1)) * plotW;
    const toY = (z: number) => PAD.top + plotH - ((z - minZ) / (maxZ - minZ)) * plotH;

    // Clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Gridlines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = PAD.top + plotH * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();
    }

    // Fill between curves (cut/fill areas)
    for (let i = 0; i < distances.length - 1; i++) {
      if (z1[i] == null || z2[i] == null || z1[i + 1] == null || z2[i + 1] == null) continue;
      const x0 = toX(distances[i]);
      const x1n = toX(distances[i + 1]);
      const y1a = toY(z1[i]);
      const y2a = toY(z2[i]);
      const y1b = toY(z1[i + 1]);
      const y2b = toY(z2[i + 1]);

      ctx.beginPath();
      ctx.moveTo(x0, y1a);
      ctx.lineTo(x1n, y1b);
      ctx.lineTo(x1n, y2b);
      ctx.lineTo(x0, y2a);
      ctx.closePath();

      // Blue if epoch2 < epoch1 (cut), red if epoch2 > epoch1 (fill)
      const avgDz = ((z2[i] - z1[i]) + (z2[i + 1] - z1[i + 1])) / 2;
      ctx.fillStyle = avgDz < 0 ? CUT_COLOR : FILL_COLOR;
      ctx.fill();
    }

    // Epoch 1 surface — filled area from bottom
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < distances.length; i++) {
      if (z1[i] == null) continue;
      const x = toX(distances[i]);
      const y = toY(z1[i]);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    // Close along bottom
    for (let i = distances.length - 1; i >= 0; i--) {
      if (z1[i] == null) continue;
      ctx.lineTo(toX(distances[i]), PAD.top + plotH);
      break;
    }
    for (let i = 0; i < distances.length; i++) {
      if (z1[i] == null) continue;
      ctx.lineTo(toX(distances[i]), PAD.top + plotH);
      break;
    }
    ctx.closePath();
    ctx.fillStyle = EPOCH1_COLOR;
    ctx.fill();

    // Epoch 1 line
    ctx.beginPath();
    started = false;
    for (let i = 0; i < distances.length; i++) {
      if (z1[i] == null) continue;
      const x = toX(distances[i]);
      const y = toY(z1[i]);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Epoch 2 line
    ctx.beginPath();
    started = false;
    for (let i = 0; i < distances.length; i++) {
      if (z2[i] == null) continue;
      const x = toX(distances[i]);
      const y = toY(z2[i]);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = EPOCH2_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', PAD.left, HEIGHT - 6);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxDist.toFixed(1)} m`, PAD.left + plotW, HEIGHT - 6);
    ctx.textAlign = 'center';
    ctx.fillText('Distance', PAD.left + plotW / 2, HEIGHT - 6);

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${maxZ.toFixed(1)}`, PAD.left - 4, PAD.top + 4);
    ctx.textBaseline = 'top';
    ctx.fillText(`${minZ.toFixed(1)}`, PAD.left - 4, PAD.top + plotH - 4);

    // Legend
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const legendX = PAD.left + plotW;
    const legendY = PAD.top + 2;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(legendX - 50, legendY, 12, 2);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('E1', legendX - 4, legendY - 3);
    ctx.fillStyle = EPOCH2_COLOR;
    ctx.fillRect(legendX - 50, legendY + 10, 12, 2);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('E2', legendX - 4, legendY + 7);
  }, [data]);

  return (
    <div className="cross-section-container">
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT, display: 'block', borderRadius: 6 }}
      />
    </div>
  );
}
