"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    job_id: str
    status: str


class JobStats(BaseModel):
    epoch1_count: int
    epoch2_count: int
    diff_count: int
    icp_rmse: float
    icp_fitness: float
    min_dz: float
    max_dz: float
    mean_dz: float
    std_dz: float
    color_range_min: float
    color_range_max: float
    cut_volume: float
    fill_volume: float
    net_volume: float


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: str
    stats: Optional[JobStats] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
