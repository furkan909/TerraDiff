# TerraDiff

**3D Change Detection & Volumetric Analysis for Point Cloud Data**

TerraDiff is a full-stack web application that automates terrain change detection between two LiDAR survey epochs. Upload two LAS/LAZ files, and get instant 3D visualization of elevation changes, cut/fill volumes, cross-section profiles, and more.

No cloud uploads. No subscriptions. Everything runs locally.

---

## Features

### Core Pipeline
- **Automated ICP Alignment** — Iterative Closest Point registration aligns epoch 2 to epoch 1
- **Grid-Based Differencing** — Interpolates both epochs onto a common grid, computes dZ = epoch2 - epoch1
- **RdBu Colormap** — Diverging colormap with percentile-based clamping (blue = cut, red = fill)

### Analysis Tools
- **Cut/Fill Volume Computation** — Cell-area integration of positive and negative dZ regions
- **Cross-Section Profiling** — Draw a line across the 3D view, get a 2D elevation chart of both surfaces
- **dZ Histogram** — Distribution chart of elevation changes across the entire diff grid
- **Contour Lines** — Elevation contour overlay draped on the 3D surface, toggle on/off
- **Measurement Tool** — Click two points to measure 3D distance, horizontal distance, and elevation difference
- **dZ Filtering** — Isolate cut-only, fill-only, or view all changes

### Visualization
- **Interactive 3D Viewer** — Three.js renderer with orbit, pan, zoom controls at 60fps
- **Epoch Toggling** — Switch between Epoch 1, Epoch 2, and Diff views
- **Screenshot Export** — One-click PNG download of the current 3D view
- **Minimap** — Viewport indicator showing current camera position
- **Adaptive Point Sizing** — Auto-calculated from point density

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, NumPy, SciPy, Open3D, Matplotlib |
| **Frontend** | React 18, TypeScript, Three.js, Vite |
| **Data Format** | Binary Float32 streaming (interleaved x,y,z,r,g,b) |
| **Deployment** | Docker Compose |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Docker

```bash
docker compose up --build
```

Backend at `:8000`, frontend at `:3000`.

---

## Usage

1. Open the app and drag-drop two LAS/LAZ files (epoch 1 and epoch 2)
2. Wait for processing (read → align → difference)
3. Explore the 3D diff view with orbit controls
4. Toggle between Epoch 1 / Epoch 2 / Diff views
5. Use the side panel to inspect volumes, statistics, and charts
6. Select tools from the toolbar: Measure, Cross-Section, Screenshot

---

## Project Structure

```
terradiff/
├── backend/
│   ├── main.py                    # FastAPI routes & endpoints
│   ├── models.py                  # Pydantic schemas
│   ├── services/
│   │   ├── pointcloud.py          # LAS/LAZ I/O
│   │   ├── alignment.py           # ICP registration (Open3D)
│   │   ├── differencing.py        # Grid differencing & colormap
│   │   └── pipeline.py            # Job orchestration & binary packing
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main application component
│   │   ├── App.css                # Design system & styles
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── api.ts                 # API client functions
│   │   └── components/
│   │       ├── PointCloudViewer.tsx   # Three.js 3D renderer
│   │       ├── StatsPanel.tsx         # Statistics & volumes
│   │       ├── CrossSectionChart.tsx  # 2D profile chart
│   │       ├── DzHistogram.tsx        # Elevation change distribution
│   │       ├── ViewerToolbar.tsx      # Tool selection
│   │       ├── ViewerControls.tsx     # Display settings & contour toggle
│   │       ├── DzFilter.tsx           # Cut/fill filter
│   │       ├── MeasureResult.tsx      # Measurement display
│   │       ├── Minimap.tsx            # Viewport indicator
│   │       └── ...
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload two LAS/LAZ files, starts processing |
| `GET` | `/api/jobs/{id}` | Job status, stats, and volumes |
| `GET` | `/api/jobs/{id}/pointcloud/{dataset}` | Binary point cloud data (epoch1/epoch2/diff) |
| `GET` | `/api/jobs/{id}/cross-section` | Sample elevation profiles along a line |
| `GET` | `/api/jobs/{id}/contours` | Extract contour polylines from surface grid |

---

## Use Cases

- Construction site monitoring & earthwork verification
- Mining stockpile volume measurement
- Coastal erosion & sediment transport tracking
- Archaeological excavation documentation
- Landslide & slope stability assessment
- Infrastructure deformation monitoring

---

## License

MIT
