export type ViewMode = 'epoch1' | 'epoch2' | 'diff';

export interface JobStats {
  epoch1_count: number;
  epoch2_count: number;
  diff_count: number;
  icp_rmse: number;
  icp_fitness: number;
  min_dz: number;
  max_dz: number;
  mean_dz: number;
  std_dz: number;
  color_range_min: number;
  color_range_max: number;
  cut_volume: number;
  fill_volume: number;
  net_volume: number;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: string;
  stats: JobStats | null;
  error: string | null;
}

export interface PointCloudData {
  positions: Float32Array;
  colors: Float32Array;
  numPoints: number;
  dzValues?: Float32Array;
}

export interface PickedPoint {
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
}

export interface ViewerSettings {
  pointSize: number;
  opacity: number;
  showContours: boolean;
}

export type ToolMode = 'orbit' | 'measure' | 'cross-section';

export interface CrossSectionData {
  distances: number[];
  z1: number[];
  z2: number[];
}

export interface ContourData {
  contours: { level: number; segments: number[][] }[];
}

export interface CameraState {
  targetX: number;
  targetY: number;
  distance: number;
  fov: number;
  aspect: number;
}

export interface Measurement {
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  distance3D: number;
  distanceXY: number;
  dz: number;
}
