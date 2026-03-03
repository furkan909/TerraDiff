"""Grid-based elevation differencing and colormap application."""

import numpy as np
from scipy.interpolate import griddata
from matplotlib import colormaps
from dataclasses import dataclass


@dataclass
class DiffResult:
    points: np.ndarray  # XYZ of diff grid points
    colors: np.ndarray  # RGB colors [0,1] from diverging colormap
    dz_values: np.ndarray  # Raw elevation differences
    min_dz: float
    max_dz: float
    mean_dz: float
    std_dz: float
    color_range_min: float  # Clamped range used for colormap
    color_range_max: float
    cut_volume: float  # Volume of negative dZ (excavation), positive number
    fill_volume: float  # Volume of positive dZ (fill), positive number
    net_volume: float  # fill_volume - cut_volume
    # Grid arrays for cross-section and contour sampling
    z1_grid: np.ndarray  # 2D grid of epoch1 Z values (may contain NaN)
    z2_grid: np.ndarray  # 2D grid of epoch2 Z values (may contain NaN)
    grid_x: np.ndarray  # 1D array of grid X coordinates
    grid_y: np.ndarray  # 1D array of grid Y coordinates


def compute_difference(
    epoch1: np.ndarray,
    epoch2_aligned: np.ndarray,
    grid_resolution: float = 0.5,
) -> DiffResult:
    """Compute elevation difference on a regular grid.

    Interpolates both epochs onto a common grid, computes dZ = epoch2 - epoch1,
    and applies RdBu_r colormap (red=fill/positive, blue=cut/negative).

    Args:
        epoch1: XYZ array for reference epoch
        epoch2_aligned: XYZ array for aligned comparison epoch
        grid_resolution: Grid cell size in same units as point cloud

    Returns:
        DiffResult with colored grid points and statistics.
    """
    # Determine common grid extent
    all_xy = np.vstack([epoch1[:, :2], epoch2_aligned[:, :2]])
    x_min, y_min = all_xy.min(axis=0)
    x_max, y_max = all_xy.max(axis=0)

    grid_x = np.arange(x_min, x_max, grid_resolution)
    grid_y = np.arange(y_min, y_max, grid_resolution)
    gx, gy = np.meshgrid(grid_x, grid_y)
    grid_points = np.column_stack([gx.ravel(), gy.ravel()])

    # Interpolate Z values for both epochs
    z1 = griddata(epoch1[:, :2], epoch1[:, 2], grid_points, method="linear")
    z2 = griddata(epoch2_aligned[:, :2], epoch2_aligned[:, 2], grid_points, method="linear")

    # Store full 2D grids before NaN filtering (for cross-section / contour sampling)
    ny, nx = gx.shape
    z1_grid = z1.reshape(ny, nx)
    z2_grid = z2.reshape(ny, nx)

    # Remove NaN (points outside convex hull of either epoch)
    valid = ~(np.isnan(z1) | np.isnan(z2))
    grid_points = grid_points[valid]
    z1 = z1[valid]
    z2 = z2[valid]

    dz = z2 - z1

    # Volume computation: cell_area × sum of dZ for cut and fill
    cell_area = grid_resolution ** 2
    cut_volume = float(-np.sum(dz[dz < 0]) * cell_area)   # positive number
    fill_volume = float(np.sum(dz[dz > 0]) * cell_area)    # positive number
    net_volume = float(fill_volume - cut_volume)

    # Use mean Z as display height for diff points
    z_mean = (z1 + z2) / 2
    xyz = np.column_stack([grid_points, z_mean])

    # Colormap: RdBu_r — red for positive (fill), blue for negative (cut)
    # Use percentile-based clamping so small localized changes aren't washed out
    cmap = colormaps["RdBu_r"]
    p_low = np.percentile(dz, 2)
    p_high = np.percentile(dz, 98)
    abs_max = max(abs(p_low), abs(p_high), 0.01)
    dz_clamped = np.clip(dz, -abs_max, abs_max)
    normalized = (dz_clamped + abs_max) / (2 * abs_max)  # Map to [0, 1]
    colors = cmap(normalized)[:, :3]  # RGB only, drop alpha

    return DiffResult(
        points=xyz,
        colors=colors,
        dz_values=dz,
        min_dz=float(dz.min()),
        max_dz=float(dz.max()),
        mean_dz=float(dz.mean()),
        std_dz=float(dz.std()),
        color_range_min=float(-abs_max),
        color_range_max=float(abs_max),
        cut_volume=cut_volume,
        fill_volume=fill_volume,
        net_volume=net_volume,
        z1_grid=z1_grid,
        z2_grid=z2_grid,
        grid_x=grid_x,
        grid_y=grid_y,
    )
