"""ICP registration with Open3D."""

import numpy as np
import open3d as o3d
from dataclasses import dataclass

from .pointcloud import numpy_to_open3d, open3d_to_numpy


@dataclass
class AlignmentResult:
    aligned_points: np.ndarray
    rmse: float
    fitness: float
    transformation: np.ndarray


def align_icp(
    source: np.ndarray,
    target: np.ndarray,
    voxel_size: float = 0.5,
    max_correspondence_distance: float = 2.0,
) -> AlignmentResult:
    """Align source to target using point-to-plane ICP.

    Args:
        source: XYZ array to be aligned (epoch2)
        target: XYZ reference array (epoch1)
        voxel_size: Downsample voxel size for registration
        max_correspondence_distance: Max distance for ICP correspondences

    Returns:
        AlignmentResult with aligned points, RMSE, fitness, and transformation matrix.
    """
    src_pcd = numpy_to_open3d(source)
    tgt_pcd = numpy_to_open3d(target)

    # Downsample for registration
    src_down = src_pcd.voxel_down_sample(voxel_size)
    tgt_down = tgt_pcd.voxel_down_sample(voxel_size)

    # Estimate normals (required for point-to-plane)
    search_param = o3d.geometry.KDTreeSearchParamHybrid(radius=voxel_size * 2, max_nn=30)
    src_down.estimate_normals(search_param)
    tgt_down.estimate_normals(search_param)

    # Point-to-plane ICP
    result = o3d.pipelines.registration.registration_icp(
        src_down,
        tgt_down,
        max_correspondence_distance,
        np.eye(4),
        o3d.pipelines.registration.TransformationEstimationPointToPlane(),
        o3d.pipelines.registration.ICPConvergenceCriteria(max_iteration=100),
    )

    # Apply transformation to full-resolution source
    src_pcd.transform(result.transformation)
    aligned = open3d_to_numpy(src_pcd)

    return AlignmentResult(
        aligned_points=aligned,
        rmse=result.inlier_rmse,
        fitness=result.fitness,
        transformation=np.array(result.transformation),
    )
