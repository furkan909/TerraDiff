import { JobStatus, PointCloudData, CrossSectionData, ContourData } from './types';

export async function uploadFiles(file1: File, file2: File): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append('file1', file1);
  form.append('file2', file2);

  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function pollJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`/api/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPointCloudBinary(
  jobId: string,
  dataset: 'epoch1' | 'epoch2' | 'diff'
): Promise<PointCloudData> {
  const res = await fetch(`/api/jobs/${jobId}/pointcloud/${dataset}`);
  if (!res.ok) throw new Error(`Fetch ${dataset} failed: ${res.statusText}`);

  const numPoints = parseInt(res.headers.get('X-Num-Points') || '0', 10);
  const buffer = await res.arrayBuffer();
  const floats = new Float32Array(buffer);

  // Detect format: 7 floats per point (x,y,z,r,g,b,dz) for diff, 6 otherwise
  const floatsPerPoint = floats.length / numPoints;
  const hasDz = Math.abs(floatsPerPoint - 7) < 0.5;
  const stride = hasDz ? 7 : 6;

  const positions = new Float32Array(numPoints * 3);
  const colors = new Float32Array(numPoints * 3);
  const dzValues = hasDz ? new Float32Array(numPoints) : undefined;

  for (let i = 0; i < numPoints; i++) {
    const offset = i * stride;
    positions[i * 3] = floats[offset];
    positions[i * 3 + 1] = floats[offset + 1];
    positions[i * 3 + 2] = floats[offset + 2];
    colors[i * 3] = floats[offset + 3];
    colors[i * 3 + 1] = floats[offset + 4];
    colors[i * 3 + 2] = floats[offset + 5];
    if (hasDz && dzValues) {
      dzValues[i] = floats[offset + 6];
    }
  }

  return { positions, colors, numPoints, dzValues };
}

export async function fetchCrossSection(
  jobId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Promise<CrossSectionData> {
  const params = new URLSearchParams({
    x1: x1.toString(),
    y1: y1.toString(),
    x2: x2.toString(),
    y2: y2.toString(),
  });
  const res = await fetch(`/api/jobs/${jobId}/cross-section?${params}`);
  if (!res.ok) throw new Error(`Cross-section failed: ${res.statusText}`);
  return res.json();
}

export async function fetchContours(
  jobId: string,
  numLevels: number = 10,
  surface: string = 'diff',
): Promise<ContourData> {
  const params = new URLSearchParams({
    num_levels: numLevels.toString(),
    surface,
  });
  const res = await fetch(`/api/jobs/${jobId}/contours?${params}`);
  if (!res.ok) throw new Error(`Contours failed: ${res.statusText}`);
  return res.json();
}
