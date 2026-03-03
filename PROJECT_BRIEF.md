# TerraDiff — Automated Change Detection & Volumetric Analysis for Drone Survey Data

**Tagline:** Turn repeat drone surveys into actionable insights — automatically.

---

## Problem

Geomatics engineers repeatedly survey construction sites, mines, stockpiles, and unstable terrain across multiple time periods. Yet comparing point clouds or surface models to detect change and compute cut/fill volumes is still a manual, error-prone workflow—often locked behind expensive proprietary software.

Dataset alignment, noise filtering, surface differencing, interpretation, and client-ready reporting can consume hours per survey pair and doesn't scale well across multi-epoch projects.

## Solution

A web-based platform where engineers upload two or more point clouds (LAS/LAZ) or surface models (GeoTIFF DSM/DTM). TerraDiff automates the full pipeline:

1. **Automatic co-registration** of multi-temporal datasets
2. **Differential surface computation** to isolate change
3. **Change classification** (excavation, fill, vegetation growth, structural/ground movement)
4. **Cut/fill volume estimation** with engineering-grade controls
5. **Interactive 3D visualization** with temporal comparison
6. **Professional report generation** ready for client delivery

No desktop installs. No license friction. Upload → process → deliver.

## Key Features

- **Browser-based 3D viewer** — Potree/Three.js rendering with a time-slider for epoch comparison
- **Automatic alignment** — ICP + feature-based registration, with residual/error diagnostics and confidence metrics
- **Change classification (optional)** — Lightweight ML labels change types (construction activity, vegetation, ground movement)
- **Cut/fill volumes** — TIN-based and grid-based differencing with configurable thresholds, masks, and density controls
- **Report engine** — Auto-generated PDF with plan-view maps, cross-sections, volume tables, and heatmaps
- **Multi-epoch dashboard** — Track cumulative change trends across a project timeline
- **QA + traceability** — Registration residuals, uncertainty estimates, processing parameters, and reproducible run metadata

## Data Handling

- **Coordinate reference** — Ingests GCP/RTK metadata; detects CRS from file headers when available
- **Variable density** — Handles differing point densities across epochs (resampling / adaptive gridding)
- **Vegetation filtering** — Optional ground classification pass to separate canopy from terrain change
- **Water / no-data masking** — Exclusion zones for water bodies, voids, and low-confidence regions

## Workflow

`Upload (LAS/LAZ, GeoTIFF) → Align / Co-register → Compute Differences → Detect / Classify Change → Compute Volumes → 3D View + Export Report`

## Tech Stack

| Layer            | Technology                                       |
|------------------|--------------------------------------------------|
| Frontend         | React, Three.js / Potree                         |
| Backend          | Python (FastAPI)                                 |
| Point clouds     | PDAL, Open3D, Laspy                              |
| Rasters          | Rasterio, NumPy                                  |
| ML (optional)    | scikit-learn or lightweight PyTorch               |
| Reports          | ReportLab or WeasyPrint                           |
| Storage          | PostgreSQL + PostGIS, S3-compatible object store  |

## Compliance & Security

- **Encryption at rest** — Uploaded datasets and generated outputs encrypted in storage
- **Project access control** — Role-based permissions (owner, editor, viewer)
- **Audit logs** — Timestamped record of uploads, processing runs, parameter changes, and exports
- **Data retention controls** — Configurable retention and auto-deletion policies per project

## Outputs / Deliverables

- Shareable interactive 3D change viewer
- Classified change regions with area/volume metrics
- Cut/fill summary tables with uncertainty bounds
- Cross-section profiles along user-defined lines
- Client-ready PDF report (including a QA checklist)
- CSV / GeoJSON exports (change polygons, stats)

## Why It Matters

- **Cost reduction** — Reduces dependence on per-seat licenses (Virtual Surveyor, Pix4D, CAD/GIS plugins)
- **Time savings** — Automates a workflow that takes hours per survey pair
- **Accessibility** — Makes volumetric analysis viable for smaller firms and independent surveyors
- **Consistency** — Repeatable processing reduces interpretation variability across projects
- **Multi-epoch clarity** — Turns repeated surveys into a coherent timeline, not isolated comparisons

## Differentiators

- **End-to-end in the browser** — No desktop installs, no plugin chains, no format juggling
- **Multi-epoch first** — Designed for full project lifecycles, not just two snapshots
- **More than differencing** — Labels *what* changed, not only *how much*
- **Engineer-first outputs** — Reports, tables, and exports aligned with real deliverables
- **Built-in QA** — Registration diagnostics and uncertainty reporting baked in, not bolted on

## Pricing Model (Planned)

- **Per-project processing** — Pay per dataset pair processed; no seat licenses
- **Team plan** — Flat monthly rate with shared workspace, access controls, and priority processing
- **Free tier** — Sample data and capped file sizes for evaluation

## Suggested MVP Options

**MVP 1 — 3D Change Viewer (Recommended)**
Upload two LAS/LAZ files → auto-align → compute elevation differences → interactive 3D heatmap + time toggle.
*Validates:* registration pipeline, rendering performance, upload/processing UX.

**MVP 2 — Volume Computation Engine**
Upload two DSM GeoTIFFs → difference raster → delineate change regions → cut/fill volumes → PDF summary + map exports.
*Validates:* volume accuracy, parameter controls, report generation.

**MVP 3 — Multi-Epoch Dashboard**
Upload 3+ epochs → timeline view of cumulative volume change + clickable epochs (start with sample data).
*Validates:* temporal data model, dashboard UX, trend visualization.
