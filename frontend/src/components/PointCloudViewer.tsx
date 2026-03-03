import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointCloudData, PickedPoint, ToolMode, Measurement, CameraState, ContourData } from '../types';

interface Props {
  data: PointCloudData | null;
  pointSize?: number;
  opacity?: number;
  toolMode?: ToolMode;
  onPointPick?: (point: PickedPoint | null) => void;
  onMeasure?: (m: Measurement | null) => void;
  onCrossSection?: (start: { x: number; y: number; z: number }, end: { x: number; y: number; z: number }) => void;
  cameraRef?: MutableRefObject<CameraState | null>;
  screenshotRef?: MutableRefObject<(() => void) | null>;
  contours?: ContourData | null;
}

const FADE_DURATION = 300; // ms

export default function PointCloudViewer({
  data,
  pointSize: externalPointSize,
  opacity: externalOpacity,
  toolMode = 'orbit',
  onPointPick,
  onMeasure,
  onCrossSection,
  cameraRef,
  screenshotRef,
  contours,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    points: THREE.Points | null;
    fadingOut: THREE.Points | null;
    fadeStart: number;
    animId: number;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    measureLine: THREE.Mesh | null;
    measureStart: THREE.Vector3 | null;
    measureDots: THREE.Mesh[];
    autoPointSize: number;
    targetOpacity: number;
    sceneScale: number;
    contourGroup: THREE.Group | null;
    crossSectionLine: THREE.Mesh | null;
    crossSectionStart: THREE.Vector3 | null;
    crossSectionDots: THREE.Mesh[];
  } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e11);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    camera.position.set(50, 50, 80);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    camera.up.set(0, 0, 1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points!.threshold = 0.5;
    const mouse = new THREE.Vector2();

    const state = {
      scene,
      camera,
      renderer,
      controls,
      points: null as THREE.Points | null,
      fadingOut: null as THREE.Points | null,
      fadeStart: 0,
      animId: 0,
      raycaster,
      mouse,
      measureLine: null as THREE.Mesh | null,
      measureStart: null as THREE.Vector3 | null,
      measureDots: [] as THREE.Mesh[],
      autoPointSize: 1.5,
      targetOpacity: 1.0,
      sceneScale: 100,
      contourGroup: null,
      crossSectionLine: null,
      crossSectionStart: null,
      crossSectionDots: [],
    };
    sceneRef.current = state;

    // Assign screenshot function
    if (screenshotRef) {
      screenshotRef.current = () => {
        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `terradiff-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        a.click();
      };
    }

    const animate = (time: number) => {
      state.animId = requestAnimationFrame(animate);
      controls.update();

      // Handle crossfade animation
      if (state.fadingOut) {
        const elapsed = time - state.fadeStart;
        const t = Math.min(elapsed / FADE_DURATION, 1);
        const fadeOutMat = state.fadingOut.material as THREE.PointsMaterial;
        fadeOutMat.opacity = state.targetOpacity * (1 - t);

        if (state.points) {
          const fadeInMat = state.points.material as THREE.PointsMaterial;
          fadeInMat.opacity = state.targetOpacity * t;
        }

        if (t >= 1) {
          scene.remove(state.fadingOut);
          state.fadingOut.geometry.dispose();
          (state.fadingOut.material as THREE.Material).dispose();
          state.fadingOut = null;
        }
      }

      // Write camera state for minimap
      if (cameraRef) {
        const target = controls.target;
        const dist = camera.position.distanceTo(target);
        cameraRef.current = {
          targetX: target.x,
          targetY: target.y,
          distance: dist,
          fov: camera.fov,
          aspect: camera.aspect,
        };
      }

      renderer.render(scene, camera);
    };
    animate(performance.now());

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(state.animId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update point cloud data with crossfade
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    // Move current points to fading-out layer
    if (state.fadingOut) {
      state.scene.remove(state.fadingOut);
      state.fadingOut.geometry.dispose();
      (state.fadingOut.material as THREE.Material).dispose();
      state.fadingOut = null;
    }

    if (state.points) {
      state.fadingOut = state.points;
      state.fadeStart = performance.now();
      state.points = null;
    }

    if (!data || data.numPoints === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const center = new THREE.Vector3();
    box.getCenter(center);
    const bboxSize = new THREE.Vector3();
    box.getSize(bboxSize);

    const area = Math.max(bboxSize.x * bboxSize.y, 1);
    const density = data.numPoints / area;
    state.autoPointSize = Math.max(0.3, Math.min(3.0, 1.8 / Math.sqrt(density)));
    state.targetOpacity = externalOpacity ?? 1.0;
    state.sceneScale = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);

    const material = new THREE.PointsMaterial({
      size: externalPointSize ?? state.autoPointSize,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: state.fadingOut ? 0 : state.targetOpacity, // start transparent if crossfading
    });

    const points = new THREE.Points(geometry, material);
    state.scene.add(points);
    state.points = points;

    state.raycaster.params.Points!.threshold = (externalPointSize ?? state.autoPointSize) * 0.8;

    const maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);
    const dist = maxDim * 1.5;

    state.camera.position.set(center.x + dist * 0.5, center.y - dist * 0.3, center.z + dist * 0.8);
    state.controls.target.copy(center);
    state.controls.update();
  }, [data]);

  // Update material properties when sliders change
  useEffect(() => {
    const state = sceneRef.current;
    if (!state?.points) return;
    const mat = state.points.material as THREE.PointsMaterial;
    if (externalPointSize !== undefined) mat.size = externalPointSize;
    if (externalOpacity !== undefined) {
      mat.opacity = externalOpacity;
      state.targetOpacity = externalOpacity;
    }
    mat.needsUpdate = true;
  }, [externalPointSize, externalOpacity]);

  // Toggle orbit controls based on tool mode
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    if (toolMode === 'measure' || toolMode === 'cross-section') {
      state.controls.mouseButtons = {
        LEFT: -1 as any,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
    } else {
      state.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      };
    }
  }, [toolMode]);

  // Clear measurement visuals when switching tool mode
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    if (toolMode !== 'measure') {
      clearMeasureVisuals(state);
      state.measureStart = null;
    }
    if (toolMode !== 'cross-section') {
      clearCrossSectionVisuals(state);
      state.crossSectionStart = null;
    }
  }, [toolMode]);

  // Render contour lines
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    // Clear existing contour group
    if (state.contourGroup) {
      state.scene.remove(state.contourGroup);
      state.contourGroup.traverse((obj) => {
        if (obj instanceof THREE.Line) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      state.contourGroup = null;
    }

    if (!contours || contours.contours.length === 0) return;

    // Small Z offset so contours sit visibly above the point cloud surface
    const zOffset = state.sceneScale * 0.002;

    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      depthTest: true,
      depthWrite: false,  // prevent z-fighting with points
    });

    for (const contour of contours.contours) {
      if (contour.segments.length < 2) continue;
      const positions = new Float32Array(contour.segments.length * 3);
      for (let i = 0; i < contour.segments.length; i++) {
        positions[i * 3] = contour.segments[i][0];
        positions[i * 3 + 1] = contour.segments[i][1];
        positions[i * 3 + 2] = contour.segments[i][2] + zOffset;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, material);
      group.add(line);
    }

    state.scene.add(group);
    state.contourGroup = group;
  }, [contours]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const state = sceneRef.current;
      if (!state?.points) return;

      const rect = containerRef.current!.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      state.raycaster.setFromCamera(state.mouse, state.camera);
      const intersects = state.raycaster.intersectObject(state.points);

      if (intersects.length === 0) {
        if (toolMode !== 'measure' && toolMode !== 'cross-section') onPointPick?.(null);
        return;
      }

      const p = intersects[0].point;

      if (toolMode === 'measure') {
        const dotRadius = state.sceneScale * 0.006;
        const tubeRadius = state.sceneScale * 0.003;

        if (!state.measureStart) {
          clearMeasureVisuals(state);
          onMeasure?.(null);
          state.measureStart = p.clone();
          addDot(state, p, 0x5bb8a4, dotRadius);
        } else {
          addDot(state, p, 0x5bb8a4, dotRadius);
          drawTube(state, state.measureStart, p, tubeRadius);

          const dx = p.x - state.measureStart.x;
          const dy = p.y - state.measureStart.y;
          const dz = p.z - state.measureStart.z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const distXY = Math.sqrt(dx * dx + dy * dy);

          onMeasure?.({
            start: { x: state.measureStart.x, y: state.measureStart.y, z: state.measureStart.z },
            end: { x: p.x, y: p.y, z: p.z },
            distance3D: dist3D,
            distanceXY: distXY,
            dz: dz,
          });

          state.measureStart = null;
        }
      } else if (toolMode === 'cross-section') {
        const dotRadius = state.sceneScale * 0.006;
        const tubeRadius = state.sceneScale * 0.003;

        if (!state.crossSectionStart) {
          clearCrossSectionVisuals(state);
          state.crossSectionStart = p.clone();
          addCrossSectionDot(state, p, 0xe8a87c, dotRadius);
        } else {
          addCrossSectionDot(state, p, 0xe8a87c, dotRadius);
          drawCrossSectionTube(state, state.crossSectionStart, p, tubeRadius);

          onCrossSection?.(
            { x: state.crossSectionStart.x, y: state.crossSectionStart.y, z: state.crossSectionStart.z },
            { x: p.x, y: p.y, z: p.z },
          );

          state.crossSectionStart = null;
        }
      } else {
        onPointPick?.({
          x: p.x,
          y: p.y,
          z: p.z,
          screenX: e.clientX,
          screenY: e.clientY,
        });
      }
    },
    [toolMode, onPointPick, onMeasure, onCrossSection]
  );

  return (
    <div
      ref={containerRef}
      className="viewer-container"
      onClick={handleClick}
      style={{ cursor: toolMode === 'measure' || toolMode === 'cross-section' ? 'crosshair' : 'grab' }}
    />
  );
}

function clearMeasureVisuals(state: {
  scene: THREE.Scene;
  measureLine: THREE.Mesh | null;
  measureDots: THREE.Mesh[];
}) {
  if (state.measureLine) {
    state.scene.remove(state.measureLine);
    state.measureLine.geometry.dispose();
    (state.measureLine.material as THREE.Material).dispose();
    state.measureLine = null;
  }
  for (const dot of state.measureDots) {
    state.scene.remove(dot);
    dot.geometry.dispose();
    (dot.material as THREE.Material).dispose();
  }
  state.measureDots = [];
}

function addDot(
  state: { scene: THREE.Scene; measureDots: THREE.Mesh[] },
  position: THREE.Vector3,
  color: number,
  radius: number
) {
  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.renderOrder = 999;
  state.scene.add(mesh);
  state.measureDots.push(mesh);
}

function drawTube(
  state: { scene: THREE.Scene; measureLine: THREE.Mesh | null },
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length < 0.001) return;

  const geo = new THREE.CylinderGeometry(radius, radius, length, 8, 1);
  // CylinderGeometry is along Y axis, we need to rotate it to align with our direction
  geo.translate(0, length / 2, 0);
  geo.rotateX(Math.PI / 2);

  const mat = new THREE.MeshBasicMaterial({
    color: 0x5bb8a4,
    depthTest: false,
    transparent: true,
    opacity: 0.85,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start);
  mesh.lookAt(end);
  mesh.renderOrder = 999;
  state.scene.add(mesh);
  state.measureLine = mesh;
}

function clearCrossSectionVisuals(state: {
  scene: THREE.Scene;
  crossSectionLine: THREE.Mesh | null;
  crossSectionDots: THREE.Mesh[];
}) {
  if (state.crossSectionLine) {
    state.scene.remove(state.crossSectionLine);
    state.crossSectionLine.geometry.dispose();
    (state.crossSectionLine.material as THREE.Material).dispose();
    state.crossSectionLine = null;
  }
  for (const dot of state.crossSectionDots) {
    state.scene.remove(dot);
    dot.geometry.dispose();
    (dot.material as THREE.Material).dispose();
  }
  state.crossSectionDots = [];
}

function addCrossSectionDot(
  state: { scene: THREE.Scene; crossSectionDots: THREE.Mesh[] },
  position: THREE.Vector3,
  color: number,
  radius: number
) {
  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.renderOrder = 999;
  state.scene.add(mesh);
  state.crossSectionDots.push(mesh);
}

function drawCrossSectionTube(
  state: { scene: THREE.Scene; crossSectionLine: THREE.Mesh | null },
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length < 0.001) return;

  const geo = new THREE.CylinderGeometry(radius, radius, length, 8, 1);
  geo.translate(0, length / 2, 0);
  geo.rotateX(Math.PI / 2);

  const mat = new THREE.MeshBasicMaterial({
    color: 0xe8a87c,
    depthTest: false,
    transparent: true,
    opacity: 0.85,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start);
  mesh.lookAt(end);
  mesh.renderOrder = 999;
  state.scene.add(mesh);
  state.crossSectionLine = mesh;
}
