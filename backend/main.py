"""FastAPI app with all routes, CORS, and background tasks."""

import uuid
import shutil
import numpy as np
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from models import UploadResponse, JobStatusResponse, JobStats, HealthResponse
from services.pipeline import jobs, JobData, JobState, run_pipeline

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="TerraDiff API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")


@app.post("/api/upload", response_model=UploadResponse)
async def upload(
    background_tasks: BackgroundTasks,
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    job_id = str(uuid.uuid4())
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True)

    # Save uploaded files
    file1_path = job_dir / file1.filename
    file2_path = job_dir / file2.filename

    with open(file1_path, "wb") as f:
        shutil.copyfileobj(file1.file, f)
    with open(file2_path, "wb") as f:
        shutil.copyfileobj(file2.file, f)

    # Initialize job
    jobs[job_id] = JobData()

    # Run pipeline in background
    background_tasks.add_task(run_pipeline, job_id, file1_path, file2_path)

    return UploadResponse(job_id=job_id, status="pending")


@app.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    stats = None
    if job.state == JobState.COMPLETE:
        stats = JobStats(
            epoch1_count=job.epoch1_count,
            epoch2_count=job.epoch2_count,
            diff_count=job.diff_count,
            icp_rmse=job.icp_rmse,
            icp_fitness=job.icp_fitness,
            min_dz=job.min_dz,
            max_dz=job.max_dz,
            mean_dz=job.mean_dz,
            std_dz=job.std_dz,
            color_range_min=job.color_range_min,
            color_range_max=job.color_range_max,
            cut_volume=job.cut_volume,
            fill_volume=job.fill_volume,
            net_volume=job.net_volume,
        )

    return JobStatusResponse(
        job_id=job_id,
        status=job.state.value,
        progress=job.progress,
        stats=stats,
        error=job.error,
    )


@app.get("/api/jobs/{job_id}/pointcloud/{dataset}")
def get_pointcloud(job_id: str, dataset: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job.state != JobState.COMPLETE:
        raise HTTPException(status_code=400, detail="Job not complete")

    if dataset == "epoch1":
        data = job.epoch1_binary
        num_points = job.epoch1_count
    elif dataset == "epoch2":
        data = job.epoch2_binary
        num_points = job.epoch2_count
    elif dataset == "diff":
        data = job.diff_binary
        num_points = job.diff_count
    else:
        raise HTTPException(status_code=400, detail="Invalid dataset. Use: epoch1, epoch2, diff")

    return Response(
        content=data,
        media_type="application/octet-stream",
        headers={"X-Num-Points": str(num_points)},
    )


@app.get("/api/jobs/{job_id}/cross-section")
def get_cross_section(
    job_id: str,
    x1: float = Query(...),
    y1: float = Query(...),
    x2: float = Query(...),
    y2: float = Query(...),
    num_samples: int = Query(100),
):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job.state != JobState.COMPLETE:
        raise HTTPException(status_code=400, detail="Job not complete")
    if job.z1_grid is None or job.z2_grid is None:
        raise HTTPException(status_code=400, detail="Grid data not available")

    from scipy.interpolate import RegularGridInterpolator

    # Create interpolators for both epoch grids
    interp1 = RegularGridInterpolator(
        (job.grid_y, job.grid_x), job.z1_grid,
        method="linear", bounds_error=False, fill_value=float("nan"),
    )
    interp2 = RegularGridInterpolator(
        (job.grid_y, job.grid_x), job.z2_grid,
        method="linear", bounds_error=False, fill_value=float("nan"),
    )

    # Sample along the line
    t = np.linspace(0, 1, num_samples)
    xs = x1 + t * (x2 - x1)
    ys = y1 + t * (y2 - y1)
    sample_pts = np.column_stack([ys, xs])  # RegularGridInterpolator expects (y, x) order

    z1_vals = interp1(sample_pts)
    z2_vals = interp2(sample_pts)

    # Compute distance along the line
    dx = x2 - x1
    dy = y2 - y1
    total_dist = np.sqrt(dx * dx + dy * dy)
    distances = t * total_dist

    return {
        "distances": [float(d) for d in distances],
        "z1": [float(v) if not np.isnan(v) else None for v in z1_vals],
        "z2": [float(v) if not np.isnan(v) else None for v in z2_vals],
    }


@app.get("/api/jobs/{job_id}/contours")
def get_contours(
    job_id: str,
    num_levels: int = Query(10),
    surface: str = Query("diff"),
):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job.state != JobState.COMPLETE:
        raise HTTPException(status_code=400, detail="Job not complete")
    if job.z1_grid is None or job.z2_grid is None:
        raise HTTPException(status_code=400, detail="Grid data not available")

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy.interpolate import RegularGridInterpolator

    if surface == "epoch1":
        grid = job.z1_grid
    elif surface == "epoch2":
        grid = job.z2_grid
    else:
        grid = job.z2_grid - job.z1_grid  # diff

    # Bilinear interpolator on mean surface for accurate Z placement
    mean_grid = (job.z1_grid + job.z2_grid) / 2
    z_interp = RegularGridInterpolator(
        (job.grid_y, job.grid_x), mean_grid,
        method="linear", bounds_error=False, fill_value=float("nan"),
    )

    fig, ax = plt.subplots()
    cs = ax.contour(job.grid_x, job.grid_y, grid, levels=num_levels)
    plt.close(fig)

    contours = []
    for level_idx, level_val in enumerate(cs.levels):
        paths = cs.allsegs[level_idx]
        for path in paths:
            if len(path) < 2:
                continue
            xy = np.asarray(path)
            # Sample Z via bilinear interpolation (expects y, x order)
            z_vals = z_interp(np.column_stack([xy[:, 1], xy[:, 0]]))

            # Break path at NaN gaps into separate polylines
            current_seg: list[list[float]] = []
            for i in range(len(xy)):
                z = z_vals[i]
                if np.isnan(z):
                    # Flush current segment
                    if len(current_seg) >= 2:
                        contours.append({"level": float(level_val), "segments": current_seg})
                    current_seg = []
                else:
                    current_seg.append([float(xy[i, 0]), float(xy[i, 1]), float(z)])
            # Flush remaining
            if len(current_seg) >= 2:
                contours.append({"level": float(level_val), "segments": current_seg})

    return {"contours": contours}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
