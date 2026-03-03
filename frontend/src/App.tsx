import { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode, JobStatus, PointCloudData, PickedPoint, ToolMode, ViewerSettings, Measurement, CameraState, CrossSectionData, ContourData } from './types';
import { uploadFiles, pollJobStatus, fetchPointCloudBinary, fetchCrossSection, fetchContours } from './api';
import UploadPanel from './components/UploadPanel';
import ProcessingStatus from './components/ProcessingStatus';
import PointCloudViewer from './components/PointCloudViewer';
import TimeSlider from './components/TimeSlider';
import StatsPanel from './components/StatsPanel';
import PointTooltip from './components/PointTooltip';
import ViewerToolbar from './components/ViewerToolbar';
import ViewerControls from './components/ViewerControls';
import MeasureResult from './components/MeasureResult';
import DzFilter from './components/DzFilter';
import DzHistogram from './components/DzHistogram';
import CrossSectionChart from './components/CrossSectionChart';
import Minimap from './components/Minimap';

type AppPhase = 'upload' | 'processing' | 'viewing';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('diff');
  const [datasets, setDatasets] = useState<Record<ViewMode, PointCloudData | null>>({
    epoch1: null,
    epoch2: null,
    diff: null,
  });

  // New feature state
  const [toolMode, setToolMode] = useState<ToolMode>('orbit');
  const [pickedPoint, setPickedPoint] = useState<PickedPoint | null>(null);
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({
    pointSize: 1.5,
    opacity: 1.0,
    showContours: false,
  });
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [filteredDiff, setFilteredDiff] = useState<PointCloudData | null>(null);
  const [crossSection, setCrossSection] = useState<CrossSectionData | null>(null);
  const [contours, setContours] = useState<ContourData | null>(null);

  const pollRef = useRef<number | null>(null);
  const cameraRef = useRef<CameraState | null>(null);
  const screenshotRef = useRef<(() => void) | null>(null);

  const handleUpload = useCallback(async (file1: File, file2: File) => {
    try {
      const { job_id } = await uploadFiles(file1, file2);
      setJobId(job_id);
      setPhase('processing');
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!jobId || phase !== 'processing') return;

    const poll = async () => {
      try {
        const status = await pollJobStatus(jobId);
        setJobStatus(status);

        if (status.status === 'complete') {
          const [epoch1, epoch2, diff] = await Promise.all([
            fetchPointCloudBinary(jobId, 'epoch1'),
            fetchPointCloudBinary(jobId, 'epoch2'),
            fetchPointCloudBinary(jobId, 'diff'),
          ]);
          setDatasets({ epoch1, epoch2, diff });
          setPhase('viewing');
          return;
        }

        if (status.status === 'failed') return;

        pollRef.current = window.setTimeout(poll, 2000);
      } catch (err) {
        console.error('Poll error:', err);
        pollRef.current = window.setTimeout(poll, 3000);
      }
    };

    poll();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [jobId, phase]);

  const handleReset = () => {
    setPhase('upload');
    setJobId(null);
    setJobStatus(null);
    setViewMode('diff');
    setDatasets({ epoch1: null, epoch2: null, diff: null });
    setPickedPoint(null);
    setToolMode('orbit');
    setViewerSettings({ pointSize: 1.5, opacity: 1.0, showContours: false });
    setMeasurement(null);
    setFilteredDiff(null);
    setCrossSection(null);
    setContours(null);
  };

  // Clear tooltip when switching views or tools
  useEffect(() => {
    setPickedPoint(null);
    setMeasurement(null);
    setCrossSection(null);
  }, [viewMode, toolMode]);

  // Reset filtered diff when switching away from diff view
  useEffect(() => {
    if (viewMode !== 'diff') setFilteredDiff(null);
  }, [viewMode]);

  // Fetch/clear contours when toggle changes
  useEffect(() => {
    if (viewerSettings.showContours && viewMode === 'diff' && jobId) {
      fetchContours(jobId).then(setContours).catch(console.error);
    } else {
      setContours(null);
    }
  }, [viewerSettings.showContours, viewMode, jobId]);

  const handleCrossSection = useCallback(
    async (start: { x: number; y: number; z: number }, end: { x: number; y: number; z: number }) => {
      if (!jobId) return;
      try {
        const data = await fetchCrossSection(jobId, start.x, start.y, end.x, end.y);
        setCrossSection(data);
      } catch (err) {
        console.error('Cross-section failed:', err);
      }
    },
    [jobId],
  );

  // Determine which data the viewer should show
  const activeData =
    viewMode === 'diff' && filteredDiff ? filteredDiff : datasets[viewMode];

  const hintText =
    toolMode === 'measure'
      ? 'Click any point to see coordinates. Right-drag to orbit.'
      : toolMode === 'cross-section'
        ? 'Click two points to draw a cross-section profile. Right-drag to orbit.'
        : 'Scroll to zoom. Drag to orbit. Right-drag to pan.';

  return (
    <div className="app">
      <header className="app-header">
        <h1>TerraDiff</h1>
        {phase !== 'viewing' && (
          <span className="subtitle">3D Change Detection</span>
        )}
        {phase === 'viewing' && (
          <>
            <div className="header-controls">
              <TimeSlider viewMode={viewMode} onChange={setViewMode} />
            </div>
            <button className="reset-btn" onClick={handleReset}>
              New Analysis
            </button>
          </>
        )}
      </header>

      <main className="app-main">
        {phase === 'upload' && (
          <div className="center-panel">
            <UploadPanel onUpload={handleUpload} disabled={false} />
          </div>
        )}

        {phase === 'processing' && jobStatus && (
          <div className="center-panel">
            <ProcessingStatus status={jobStatus} />
          </div>
        )}

        {phase === 'viewing' && (
          <>
            <div className="viewer-area">
              <PointCloudViewer
                data={activeData}
                pointSize={viewerSettings.pointSize}
                opacity={viewerSettings.opacity}
                toolMode={toolMode}
                onPointPick={setPickedPoint}
                onMeasure={setMeasurement}
                onCrossSection={handleCrossSection}
                cameraRef={cameraRef}
                screenshotRef={screenshotRef}
                contours={contours}
              />
              <ViewerToolbar
                toolMode={toolMode}
                onChange={setToolMode}
                onScreenshot={() => screenshotRef.current?.()}
              />
              {pickedPoint && (
                <PointTooltip
                  point={pickedPoint}
                  onClose={() => setPickedPoint(null)}
                />
              )}
              <Minimap data={activeData} cameraRef={cameraRef} />
              <div className="viewer-hint">{hintText}</div>
            </div>
            <aside className="side-panel">
              {jobStatus?.stats && (
                <StatsPanel stats={jobStatus.stats} viewMode={viewMode} />
              )}
              {measurement && (
                <MeasureResult
                  measurement={measurement}
                  onClear={() => setMeasurement(null)}
                />
              )}
              {crossSection && (
                <section className="stats-section">
                  <div className="measure-header">
                    <h3 className="section-label">Cross-Section</h3>
                    <button className="measure-clear" onClick={() => setCrossSection(null)}>
                      Clear
                    </button>
                  </div>
                  <CrossSectionChart data={crossSection} />
                </section>
              )}
              {viewMode === 'diff' && datasets.diff && datasets.diff.dzValues && jobStatus?.stats && (
                <>
                  <DzFilter
                    fullData={datasets.diff}
                    onFilter={setFilteredDiff}
                    minDz={jobStatus.stats.min_dz}
                    maxDz={jobStatus.stats.max_dz}
                  />
                  <section className="stats-section">
                    <h3 className="section-label">dZ Distribution</h3>
                    <DzHistogram
                      dzValues={datasets.diff.dzValues}
                      colorRangeMin={jobStatus.stats.color_range_min}
                      colorRangeMax={jobStatus.stats.color_range_max}
                    />
                  </section>
                </>
              )}
              <ViewerControls
                settings={viewerSettings}
                onChange={setViewerSettings}
              />
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
