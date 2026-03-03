"""Generate two synthetic LAS point clouds with known changes for testing."""

import numpy as np
import laspy
from pathlib import Path


def make_terrain(n_points: int, seed: int = 42) -> np.ndarray:
    """Generate base terrain with gaussian hills and gentle slope."""
    rng = np.random.default_rng(seed)
    x = rng.uniform(0, 100, n_points)
    y = rng.uniform(0, 100, n_points)

    # Gentle slope
    z = 0.05 * x + 0.03 * y

    # Gaussian hills
    z += 5.0 * np.exp(-((x - 30) ** 2 + (y - 60) ** 2) / (2 * 15**2))
    z += 3.0 * np.exp(-((x - 70) ** 2 + (y - 70) ** 2) / (2 * 10**2))
    z += 2.0 * np.exp(-((x - 50) ** 2 + (y - 30) ** 2) / (2 * 12**2))

    # Noise
    z += rng.normal(0, 0.05, n_points)

    return np.column_stack([x, y, z])


def write_las(points: np.ndarray, filepath: Path) -> None:
    """Write XYZ numpy array to LAS file."""
    header = laspy.LasHeader(point_format=0, version="1.2")
    header.offsets = np.min(points, axis=0)
    header.scales = np.array([0.001, 0.001, 0.001])

    las = laspy.LasData(header)
    las.x = points[:, 0]
    las.y = points[:, 1]
    las.z = points[:, 2]
    las.write(str(filepath))


def generate(output_dir: Path, n_points: int = 50_000) -> None:
    """Generate epoch1 and epoch2 LAS files."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # Epoch 1: base terrain
    epoch1_pts = make_terrain(n_points, seed=42)
    write_las(epoch1_pts, output_dir / "epoch1.las")
    print(f"Epoch 1: {len(epoch1_pts)} points, Z range [{epoch1_pts[:, 2].min():.2f}, {epoch1_pts[:, 2].max():.2f}]")

    # Epoch 2: same terrain with modifications + deliberate shift
    epoch2_pts = make_terrain(n_points, seed=43)

    # Excavation pit at (40, 40), depth -3m, radius 8m
    pit_mask = (epoch2_pts[:, 0] - 40) ** 2 + (epoch2_pts[:, 1] - 40) ** 2 < 8**2
    epoch2_pts[pit_mask, 2] -= 3.0

    # Fill mound at (70, 30), height +2m, radius 6m
    mound_dist = np.sqrt((epoch2_pts[:, 0] - 70) ** 2 + (epoch2_pts[:, 1] - 30) ** 2)
    mound_mask = mound_dist < 6
    epoch2_pts[mound_mask, 2] += 2.0 * (1 - mound_dist[mound_mask] / 6)

    # Deliberate XY shift to test ICP alignment
    epoch2_pts[:, 0] += 0.3
    epoch2_pts[:, 1] += 0.2

    write_las(epoch2_pts, output_dir / "epoch2.las")
    print(f"Epoch 2: {len(epoch2_pts)} points, Z range [{epoch2_pts[:, 2].min():.2f}, {epoch2_pts[:, 2].max():.2f}]")
    print(f"Files saved to {output_dir}")


if __name__ == "__main__":
    generate(Path(__file__).parent / "test_data")
