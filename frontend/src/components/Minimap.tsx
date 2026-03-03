import { useEffect, useRef, MutableRefObject } from 'react';
import { PointCloudData, CameraState } from '../types';

interface Props {
  data: PointCloudData | null;
  cameraRef: MutableRefObject<CameraState | null>;
}

const SIZE = 140;

export default function Minimap({ data, cameraRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<ImageData | null>(null);
  const boundsRef = useRef<{
    xMin: number; xMax: number; yMin: number; yMax: number;
    range: number; offsetX: number; offsetY: number;
    pad: number; scale: number;
  } | null>(null);

  // Build cached background ImageData when data changes
  useEffect(() => {
    const imageData = new ImageData(SIZE, SIZE);
    const pixels = imageData.data;

    // Fill background
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 20;
      pixels[i + 1] = 20;
      pixels[i + 2] = 23;
      pixels[i + 3] = 255;
    }

    boundsRef.current = null;

    if (data && data.numPoints > 0) {
      const pos = data.positions;
      const col = data.colors;
      const n = data.numPoints;

      let xMin = Infinity, xMax = -Infinity;
      let yMin = Infinity, yMax = -Infinity;
      for (let i = 0; i < n; i++) {
        const x = pos[i * 3];
        const y = pos[i * 3 + 1];
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }

      const rangeX = xMax - xMin || 1;
      const rangeY = yMax - yMin || 1;
      const range = Math.max(rangeX, rangeY);
      const offsetX = (range - rangeX) / 2;
      const offsetY = (range - rangeY) / 2;
      const pad = 6;
      const drawSize = SIZE - pad * 2;
      const scale = drawSize / range;

      boundsRef.current = { xMin, xMax, yMin, yMax, range, offsetX, offsetY, pad, scale };

      const step = n > 30000 ? Math.ceil(n / 30000) : 1;

      for (let i = 0; i < n; i += step) {
        const x = pos[i * 3];
        const y = pos[i * 3 + 1];
        const r = Math.round(col[i * 3] * 255);
        const g = Math.round(col[i * 3 + 1] * 255);
        const b = Math.round(col[i * 3 + 2] * 255);

        const px = Math.floor(pad + (x - xMin + offsetX) * scale);
        const py = Math.floor(pad + (yMax - y + offsetY) * scale);

        if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const sx = px + dx;
              const sy = py + dy;
              if (sx < SIZE && sy < SIZE) {
                const idx = (sy * SIZE + sx) * 4;
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
                pixels[idx + 3] = 255;
              }
            }
          }
        }
      }
    }

    bgImageRef.current = imageData;
  }, [data]);

  // Single animation loop: paint cached bg + live viewport overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const draw = () => {
      animId = requestAnimationFrame(draw);

      // Paint cached background
      const bg = bgImageRef.current;
      if (bg) {
        ctx.putImageData(bg, 0, 0);
      }

      // Draw viewport indicator
      const cam = cameraRef.current;
      const bounds = boundsRef.current;
      if (!cam || !bounds) return;

      const { xMin, yMax, offsetX, offsetY, pad, scale } = bounds;
      const cx = pad + (cam.targetX - xMin + offsetX) * scale;
      const cy = pad + (yMax - cam.targetY + offsetY) * scale;

      // Viewport size proportional to camera distance
      const viewHalf = cam.distance * Math.tan((cam.fov * Math.PI) / 360) * scale;
      const rawHalfW = viewHalf * cam.aspect;
      const rawHalfH = viewHalf;

      // Clamp so rectangle is always visible
      const maxHalf = (SIZE - 2) / 2;
      const halfW = Math.max(4, Math.min(rawHalfW, maxHalf));
      const halfH = Math.max(4, Math.min(rawHalfH, maxHalf));

      // Clamp center so rectangle stays partially visible
      const ccx = Math.max(-halfW + 8, Math.min(cx, SIZE + halfW - 8));
      const ccy = Math.max(-halfH + 8, Math.min(cy, SIZE + halfH - 8));

      const x1 = ccx - halfW;
      const y1 = ccy - halfH;
      const w = halfW * 2;
      const h = halfH * 2;

      // Semi-transparent fill
      ctx.fillStyle = 'rgba(91, 184, 164, 0.1)';
      ctx.fillRect(x1, y1, w, h);

      // Viewport border
      ctx.strokeStyle = 'rgba(91, 184, 164, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1, y1, w, h);

      // Corner brackets
      const cLen = Math.min(8, halfW * 0.4, halfH * 0.4);
      ctx.strokeStyle = 'rgba(91, 184, 164, 1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1 + cLen); ctx.lineTo(x1, y1); ctx.lineTo(x1 + cLen, y1);
      ctx.moveTo(x1 + w - cLen, y1); ctx.lineTo(x1 + w, y1); ctx.lineTo(x1 + w, y1 + cLen);
      ctx.moveTo(x1 + w, y1 + h - cLen); ctx.lineTo(x1 + w, y1 + h); ctx.lineTo(x1 + w - cLen, y1 + h);
      ctx.moveTo(x1 + cLen, y1 + h); ctx.lineTo(x1, y1 + h); ctx.lineTo(x1, y1 + h - cLen);
      ctx.stroke();

      // Center crosshair
      ctx.strokeStyle = 'rgba(91, 184, 164, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ccx - 4, ccy);
      ctx.lineTo(ccx + 4, ccy);
      ctx.moveTo(ccx, ccy - 4);
      ctx.lineTo(ccx, ccy + 4);
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [cameraRef, data]);

  return (
    <div className="minimap">
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="minimap-canvas" />
    </div>
  );
}
