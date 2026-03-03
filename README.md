<div align="center">

# TerraDiff

### 3D Change Detection & Volumetric Analysis for Point Cloud Data

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br />

**Upload two LiDAR scans. Get instant 3D change visualization, cut/fill volumes, cross-sections, and more.**

No cloud uploads. No subscriptions. Everything runs locally.

<br />

[Getting Started](#-quick-start) · [Features](#-features) · [Tech Stack](#%EF%B8%8F-tech-stack) · [API Reference](#-api-reference) · [Use Cases](#-use-cases)

</div>

<br />

---

<br />

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UPLOAD     │     │   ALIGN      │     │   DIFF       │     │  VISUALIZE   │
│              │────▶│              │────▶│              │────▶│              │
│  Two LAS/LAZ │     │  ICP Point   │     │  Grid-based  │     │  Interactive │
│  epoch files │     │  Cloud Reg.  │     │  Elevation   │     │  3D Heatmap  │
│              │     │              │     │  Difference   │     │  + Analysis  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

<br />

## ✨ Features

<table>
<tr>
<td width="50%">

### Core Pipeline
| Feature | Description |
|---------|-------------|
| **ICP Alignment** | Automated point cloud registration via Open3D |
| **Grid Differencing** | Bilinear interpolation onto common grid, dZ = E2 − E1 |
| **RdBu Colormap** | Percentile-clamped diverging palette (blue→white→red) |
| **Volume Computation** | Cell-area integration for cut, fill, and net volumes |

</td>
<td width="50%">

### Analysis Tools
| Tool | Description |
|------|-------------|
| **Cross-Section** | Draw a line → 2D elevation profile of both surfaces |
| **dZ Histogram** | 40-bin distribution chart of elevation changes |
| **Contour Lines** | Matplotlib-extracted isolines draped on the 3D surface |
| **Measurement** | Click two points → 3D distance, XY distance, dZ |

</td>
</tr>
</table>

<table>
<tr>
<td width="50%">

### Visualization
| Feature | Description |
|---------|-------------|
| **60fps 3D Viewer** | Three.js with orbit, pan, zoom, crossfade transitions |
| **Epoch Toggle** | Instant switch between Epoch 1 / Epoch 2 / Diff |
| **Screenshot** | One-click PNG export of the current 3D view |
| **Minimap** | Real-time viewport position indicator |

</td>
<td width="50%">

### Data & Performance
| Feature | Description |
|---------|-------------|
| **Binary Streaming** | Float32 interleaved buffers (not JSON) |
| **Adaptive Points** | Auto-sized from density, adjustable via slider |
| **dZ Filtering** | Isolate cut-only, fill-only, or all changes |
| **Zero Dependencies** | Canvas charts — no charting library needed |

</td>
</tr>
</table>

<br />

## 🛠️ Tech Stack

```
Frontend                          Backend                         Infrastructure
─────────────────────────        ─────────────────────────       ─────────────────
React 18 + TypeScript             Python 3.10+                    Docker Compose
Three.js (WebGL)                  FastAPI + Uvicorn               Nginx (production)
Vite (build tool)                 NumPy / SciPy                   Vite dev proxy
Canvas 2D (charts)                Open3D (ICP)
CSS custom properties             Matplotlib (contours)
                                  laspy (LAS/LAZ I/O)
```

<br />

### Architecture

```
Browser                           Server
┌─────────────────────────┐      ┌──────────────────────────────┐
│  React App              │      │  FastAPI                     │
│  ┌───────────────────┐  │      │  ┌────────────────────────┐  │
│  │ Three.js Viewer   │  │ ◄──► │  │ Binary Point Streams   │  │
│  │ (WebGL, 60fps)    │  │      │  │ (Float32, 24 bytes/pt) │  │
│  └───────────────────┘  │      │  └────────────────────────┘  │
│  ┌───────────────────┐  │      │  ┌────────────────────────┐  │
│  │ Canvas Charts     │  │ ◄──► │  │ Analysis Endpoints     │  │
│  │ (histogram, xsec) │  │      │  │ (cross-sec, contours)  │  │
│  └───────────────────┘  │      │  └────────────────────────┘  │
│  ┌───────────────────┐  │      │  ┌────────────────────────┐  │
│  │ Side Panel        │  │ ◄──► │  │ Processing Pipeline    │  │
│  │ (stats, controls) │  │      │  │ (read→align→diff→pack) │  │
│  └───────────────────┘  │      │  └────────────────────────┘  │
└─────────────────────────┘      └──────────────────────────────┘
```

<br />

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| pip | latest |

### Option 1: Local Development

<details>
<summary><b>Backend</b></summary>

```bash
cd backend
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

</details>

<details>
<summary><b>Frontend</b></summary>

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

</details>

### Option 2: Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8000` |

<br />

## 📖 Usage

```
 Step 1          Step 2            Step 3           Step 4            Step 5
┌────────┐    ┌──────────┐    ┌────────────┐   ┌────────────┐   ┌────────────┐
│Upload  │    │Processing│    │  Explore   │   │  Analyze   │   │  Export    │
│2 files │───▶│ pipeline │───▶│  3D view   │──▶│  volumes   │──▶│screenshot │
│LAS/LAZ │    │read→align│    │  toggle    │   │  profiles  │   │  & share  │
│        │    │→diff     │    │  epochs    │   │  histogram │   │           │
└────────┘    └──────────┘    └────────────┘   └────────────┘   └────────────┘
```

1. **Upload** — Drag-drop two LAS/LAZ epoch files
2. **Process** — Automated pipeline: read → ICP align → grid difference
3. **Explore** — Orbit the 3D heatmap, toggle Epoch 1 / Epoch 2 / Diff
4. **Analyze** — Inspect cut/fill volumes, draw cross-sections, view histogram
5. **Export** — Screenshot the current view as PNG

<br />

## 🔌 API Reference

### Endpoints

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload two LAS/LAZ files — starts background processing |
| `GET` | `/api/jobs/{id}` | Job status, statistics, and volumes |
| `GET` | `/api/jobs/{id}/pointcloud/{dataset}` | Binary point cloud stream (`epoch1` \| `epoch2` \| `diff`) |
| `GET` | `/api/jobs/{id}/cross-section` | Elevation profile along a line (`x1,y1,x2,y2`) |
| `GET` | `/api/jobs/{id}/contours` | Contour polylines extracted from surface grid |

### Binary Format

Each point is streamed as **interleaved Float32** — no JSON overhead:

```
Point (epoch1/epoch2):   [x, y, z, r, g, b]         →  6 × 4 = 24 bytes
Point (diff):            [x, y, z, r, g, b, dz]      →  7 × 4 = 28 bytes
```

*500K points = 12 MB binary vs ~80 MB JSON*

<br />

## 📁 Project Structure

```
TerraDiff/
│
├── backend/
│   ├── main.py                       # FastAPI routes (upload, status, cross-section, contours)
│   ├── models.py                     # Pydantic request/response schemas
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile
│   └── services/
│       ├── pointcloud.py             # LAS/LAZ reading via laspy
│       ├── alignment.py              # ICP registration via Open3D
│       ├── differencing.py           # Grid interpolation, dZ, colormap, volumes
│       └── pipeline.py               # Job state machine & binary packing
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Root component — state & layout orchestration
│   │   ├── App.css                   # Full design system (dark theme, 8px grid)
│   │   ├── types.ts                  # Shared TypeScript interfaces
│   │   ├── api.ts                    # Typed API client (fetch + binary parsing)
│   │   └── components/
│   │       ├── PointCloudViewer.tsx   # Three.js scene — points, contours, tools
│   │       ├── StatsPanel.tsx        # Registration, elevation change, volumes
│   │       ├── CrossSectionChart.tsx  # Canvas 2D profile chart
│   │       ├── DzHistogram.tsx       # Canvas 2D bar chart (40 bins)
│   │       ├── ViewerToolbar.tsx     # Orbit / Measure / Cross-Section / Screenshot
│   │       ├── ViewerControls.tsx    # Point size, opacity, contour toggle
│   │       ├── DzFilter.tsx          # Cut / Fill / All segmented control
│   │       ├── MeasureResult.tsx     # Distance measurement display
│   │       ├── Minimap.tsx           # Viewport position indicator
│   │       ├── UploadPanel.tsx       # Drag-drop file upload
│   │       ├── ProcessingStatus.tsx  # Pipeline progress indicator
│   │       ├── TimeSlider.tsx        # Epoch 1 / Epoch 2 / Diff selector
│   │       ├── PointTooltip.tsx      # Clicked point coordinates
│   │       └── ColorLegend.tsx       # RdBu gradient legend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

<br />

## 🌍 Use Cases

| Domain | Application |
|--------|-------------|
| **Construction** | Site monitoring, earthwork verification, progress tracking |
| **Mining** | Stockpile volume measurement, pit advancement |
| **Coastal** | Erosion tracking, sediment transport analysis |
| **Archaeology** | Excavation documentation, site change recording |
| **Geohazards** | Landslide assessment, slope stability monitoring |
| **Infrastructure** | Dam deformation, road surface degradation |
| **Forestry** | Canopy height change, biomass estimation |
| **Agriculture** | Terrain leveling verification, drainage analysis |

<br />

## 🧮 Technical Highlights

<details>
<summary><b>Why binary streaming instead of JSON?</b></summary>

Point cloud data is dense numerical data. JSON encoding adds quotes, commas, and brackets — inflating 24 bytes per point to ~120 bytes. TerraDiff streams raw Float32 arrays over HTTP with a single header (`X-Num-Points`) for metadata. The frontend parses the ArrayBuffer directly into Three.js BufferGeometry attributes with zero intermediate copies.

</details>

<details>
<summary><b>How does volume computation work?</b></summary>

After grid differencing, each cell has a known dZ value and a known area (`grid_resolution²`). Cut volume is the sum of `|dZ| × cell_area` for all cells where dZ < 0 (surface went down). Fill volume is the same for dZ > 0. Net volume = fill − cut. This is the prismoidal approximation method, standard in surveying.

</details>

<details>
<summary><b>How are contour lines placed in 3D?</b></summary>

Matplotlib's `contour()` extracts 2D isolines from the dZ grid. Each vertex is then lifted into 3D by sampling the mean surface `(z1 + z2) / 2` via `RegularGridInterpolator` for accurate bilinear height placement. NaN gaps in the surface automatically split contours into separate polylines to prevent artifacts.

</details>

<details>
<summary><b>How does the cross-section profiling work?</b></summary>

When the user clicks two points on the 3D surface, the backend receives the line endpoints and samples both epoch grids (`z1_grid`, `z2_grid`) along that line using `RegularGridInterpolator` with 100 evenly-spaced sample points. The frontend renders a canvas-based 2D chart showing both surfaces with colored fill between them (blue = cut, red = fill).

</details>

<details>
<summary><b>Design system principles</b></summary>

The UI follows a strict dark theme with warm neutrals (`#0e0e11` base) and a single desaturated teal accent (`#5bb8a4`). Typography uses Instrument Serif for display headings and DM Sans for body text. All spacing follows an 8px base scale. Components use layered elevation (raised → elevated → surface) with subtle borders rather than drop shadows. Animations use a snappy `cubic-bezier(0.16, 1, 0.3, 1)` easing curve.

</details>

<br />

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

<br />

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br />

---

<div align="center">

**Built with precision for the geospatial community.**

[Report Bug](https://github.com/Osman-Geomatics93/TerraDiff/issues) · [Request Feature](https://github.com/Osman-Geomatics93/TerraDiff/issues)

</div>
