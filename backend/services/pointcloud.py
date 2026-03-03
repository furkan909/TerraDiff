"""LAS/LAZ reading and Open3D conversion."""

import numpy as np
import laspy
import open3d as o3d
from pathlib import Path


def read_las(filepath: Path) -> np.ndarray:
    """Read LAS/LAZ file and return XYZ numpy array, centered around centroid."""
    las = laspy.read(str(filepath))
    points = np.column_stack([las.x, las.y, las.z]).astype(np.float64)
    return points


def center_points(points: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Center points around centroid to avoid float32 precision loss.

    Returns (centered_points, centroid).
    """
    centroid = points.mean(axis=0)
    return points - centroid, centroid


def numpy_to_open3d(points: np.ndarray) -> o3d.geometry.PointCloud:
    """Convert numpy XYZ array to Open3D PointCloud."""
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    return pcd


def open3d_to_numpy(pcd: o3d.geometry.PointCloud) -> np.ndarray:
    """Convert Open3D PointCloud back to numpy array."""
    return np.asarray(pcd.points)
