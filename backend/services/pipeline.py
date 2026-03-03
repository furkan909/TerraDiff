"""Orchestrator: chains services, manages job state, binary packing."""

import struct
import numpy as np
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from .pointcloud import read_las, center_points
from .alignment import align_icp
from .differencing import compute_difference


class JobState(str, Enum):
    PENDING = "pending"
    READING = "reading"
    ALIGNING = "aligning"
    DIFFERENCING = "differencing"
    COMPLETE = "complete"
    FAILED = "failed"


@dataclass
class JobData:
    state: JobState = JobState.PENDING
    progress: str = "Waiting to start"
    error: Optional[str] = None

    # Stats (populated on completion)
    epoch1_count: int = 0
    epoch2_count: int = 0
    diff_count: int = 0
    icp_rmse: float = 0.0
    icp_fitness: float = 0.0
    min_dz: float = 0.0
    max_dz: float = 0.0
    mean_dz: float = 0.0
    std_dz: float = 0.0
    color_range_min: float = 0.0
    color_range_max: float = 0.0
    cut_volume: float = 0.0
    fill_volume: float = 0.0
    net_volume: float = 0.0

    # Grid arrays for cross-section and contour sampling
    z1_grid: Optional[np.ndarray] = None
    z2_grid: Optional[np.ndarray] = None
    grid_x: Optional[np.ndarray] = None
    grid_y: Optional[np.ndarray] = None

    # Binary data (interleaved x,y,z,r,g,b as float32)
    epoch1_binary: bytes = b""
    epoch2_binary: bytes = b""
    diff_binary: bytes = b""


# In-memory job store
jobs: dict[str, JobData] = {}


def pack_points(points: np.ndarray, colors: np.ndarray, extra: np.ndarray | None = None) -> bytes:
    """Pack points and colors into interleaved float32 binary.

    Each point: [x, y, z, r, g, b] as 6 × float32 = 24 bytes.
    If extra is provided (e.g. dZ values), appends as 7th float per point.
    Colors expected in [0, 1] range.
    """
    if extra is not None:
        interleaved = np.column_stack([points, colors, extra]).astype(np.float32)
    else:
        interleaved = np.column_stack([points, colors]).astype(np.float32)
    return interleaved.tobytes()


def default_color(points: np.ndarray) -> np.ndarray:
    """Generate a height-based grayscale color for raw point clouds."""
    z = points[:, 2]
    z_min, z_max = z.min(), z.max()
    z_range = z_max - z_min if z_max > z_min else 1.0
    normalized = (z - z_min) / z_range
    # Light gray to white gradient
    r = 0.5 + 0.4 * normalized
    g = 0.5 + 0.4 * normalized
    b = 0.55 + 0.35 * normalized
    return np.column_stack([r, g, b])


def run_pipeline(job_id: str, file1_path: Path, file2_path: Path) -> None:
    """Execute the full processing pipeline for a job."""
    job = jobs[job_id]

    try:
        # Step 1: Read
        job.state = JobState.READING
        job.progress = "Reading point clouds..."
        epoch1_raw = read_las(file1_path)
        epoch2_raw = read_las(file2_path)

        # Center both around epoch1's centroid for numerical stability
        epoch1, centroid = center_points(epoch1_raw)
        epoch2 = epoch2_raw - centroid

        job.epoch1_count = len(epoch1)
        job.epoch2_count = len(epoch2)

        # Step 2: Align
        job.state = JobState.ALIGNING
        job.progress = "Aligning point clouds (ICP)..."
        alignment = align_icp(epoch2, epoch1)
        epoch2_aligned = alignment.aligned_points

        job.icp_rmse = alignment.rmse
        job.icp_fitness = alignment.fitness

        # Step 3: Difference
        job.state = JobState.DIFFERENCING
        job.progress = "Computing elevation differences..."
        diff = compute_difference(epoch1, epoch2_aligned)

        job.diff_count = len(diff.points)
        job.min_dz = diff.min_dz
        job.max_dz = diff.max_dz
        job.mean_dz = diff.mean_dz
        job.std_dz = diff.std_dz
        job.color_range_min = diff.color_range_min
        job.color_range_max = diff.color_range_max
        job.cut_volume = diff.cut_volume
        job.fill_volume = diff.fill_volume
        job.net_volume = diff.net_volume
        job.z1_grid = diff.z1_grid
        job.z2_grid = diff.z2_grid
        job.grid_x = diff.grid_x
        job.grid_y = diff.grid_y

        # Step 4: Pack binary data
        job.progress = "Packing results..."
        job.epoch1_binary = pack_points(epoch1, default_color(epoch1))
        job.epoch2_binary = pack_points(epoch2_aligned, default_color(epoch2_aligned))
        job.diff_binary = pack_points(diff.points, diff.colors, diff.dz_values)

        # Done
        job.state = JobState.COMPLETE
        job.progress = "Processing complete"

    except Exception as e:
        job.state = JobState.FAILED
        job.error = str(e)
        job.progress = f"Failed: {e}"
