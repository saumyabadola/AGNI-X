import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useThermaTwin } from "../../context/ThermaTwinContext";
import {
  RotateCcw,
  Crosshair,
  ExternalLink
} from "lucide-react";
import { CountryIndustriesHUD } from "../Map/CountryIndustriesHUD";

/**
 * Converts Latitude and Longitude to 3D Cartesian coordinates on a sphere of radius R
 */
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Generates an ultra-crisp, realistic Satellite Earth Texture Map (2048x1024)
 * with deep oceans, continental landmasses, vegetation, and mountain snowcaps.
 */
function createSatelliteEarthTexture(isDark = true) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // 1. Ocean Base with realistic bathymetry depth gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (isDark) {
    oceanGrad.addColorStop(0, "#081d38");
    oceanGrad.addColorStop(0.3, "#0a264a");
    oceanGrad.addColorStop(0.5, "#0b2e59");
    oceanGrad.addColorStop(0.7, "#0a264a");
    oceanGrad.addColorStop(1, "#081d38");
  } else {
    oceanGrad.addColorStop(0, "#1a4674");
    oceanGrad.addColorStop(0.3, "#1e528a");
    oceanGrad.addColorStop(0.5, "#2563eb");
    oceanGrad.addColorStop(0.7, "#1e528a");
    oceanGrad.addColorStop(1, "#1a4674");
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper to convert geographic lat/lon to canvas (x, y)
  const toXY = (lat, lon) => ({
    x: ((lon + 180) / 360) * canvas.width,
    y: ((90 - lat) / 180) * canvas.height
  });

  const drawPolygon = (coords, fillColor, strokeColor = null) => {
    if (coords.length === 0) return;
    ctx.beginPath();
    const first = toXY(coords[0][0], coords[0][1]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < coords.length; i++) {
      const pt = toXY(coords[i][0], coords[i][1]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // 2. Continents (Realistic satellite greens, arid savannas, deserts)
  const eurasia = [
    [70, -10], [72, 30], [70, 70], [75, 100], [72, 140], [66, 170],
    [55, 160], [45, 140], [35, 130], [30, 122], [22, 115], [10, 105],
    [1, 104], [10, 98], [22, 90], [22, 69], [25, 62], [12, 45],
    [30, 32], [37, 28], [42, 28], [45, 12], [43, 3], [36, -5],
    [44, -9], [48, -4], [54, 8], [60, 5], [60, 20], [70, 25], [70, -10]
  ];
  drawPolygon(eurasia, "#2d5427", "#1d3d18");

  // Detailed Indian Subcontinent
  const india = [
    [35, 74], [32, 76], [28, 80], [27, 88], [25, 92], [22, 89],
    [19, 85], [15, 80], [10, 79], [8, 77.5], [10, 76], [15, 74],
    [19, 72.8], [21, 72.5], [22.8, 69.5], [24, 68.5], [27, 70],
    [31, 74], [35, 74]
  ];
  drawPolygon(india, "#3f6e30", "#244d1c");

  // Thar Desert & Middle East arid terrain
  const midEast = [
    [32, 35], [37, 36], [37, 48], [30, 48], [24, 57], [18, 55],
    [12, 44], [15, 42], [28, 34], [32, 35]
  ];
  drawPolygon(midEast, "#8c734b", "#635031");

  // Africa
  const africa = [
    [37, 10], [32, 32], [12, 44], [11, 51], [2, 45], [-11, 41],
    [-26, 33], [-34, 18], [-34, 26], [-23, 14], [-12, 13], [5, 2],
    [5, -4], [15, -17], [28, -13], [36, -6], [37, 10]
  ];
  drawPolygon(africa, "#526830", "#394d1e");
  const sahara = [
    [32, -10], [35, 25], [26, 34], [16, 32], [15, -12], [24, -14], [32, -10]
  ];
  drawPolygon(sahara, "#a88953");

  // Americas & Australia
  const northAmerica = [
    [72, -160], [70, -130], [60, -80], [55, -55], [45, -60], [30, -80],
    [25, -80], [18, -95], [15, -92], [9, -78], [15, -95], [25, -110],
    [32, -117], [48, -125], [60, -140], [65, -168], [72, -160]
  ];
  drawPolygon(northAmerica, "#3b5e2b", "#223d18");

  const southAmerica = [
    [12, -72], [10, -62], [5, -52], [-5, -35], [-22, -41], [-35, -55],
    [-54, -68], [-52, -75], [-35, -72], [-18, -70], [-5, -81], [6, -78], [12, -72]
  ];
  drawPolygon(southAmerica, "#2a5924", "#183814");

  const australia = [
    [-12, 132], [-15, 145], [-24, 153], [-37, 150], [-38, 140],
    [-32, 116], [-22, 114], [-15, 125], [-12, 132]
  ];
  drawPolygon(australia, "#947648", "#6e532b");

  // 3. Himalayan Snowcaps & Alpine Ice
  const himalayas = [
    [36, 74], [34, 78], [30, 82], [28, 88], [28, 92], [30, 90], [33, 82], [36, 74]
  ];
  drawPolygon(himalayas, "#ffffff");

  // 4. Subtle Atmospheric Cloud Bands
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  for (let i = 0; i < 40; i++) {
    const cx = (i * 55) % canvas.width;
    const cy = 200 + (Math.sin(i) * 160) + (i % 2 === 0 ? 300 : 0);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70 + (i % 30), 12 + (i % 8), Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export function Globe3D() {
  const mountRef = useRef(null);
  const {
    hotspots,
    selectedHotspotId,
    setSelectedHotspotId,
    selectedCountry,
    theme
  } = useThermaTwin();

  const isDark = theme === "dark";

  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const isAutoRotatingRef = useRef(true);

  const globeGroupRef = useRef(null);
  const cameraRef = useRef(null);
  const targetRotationRef = useRef({ x: 0.35, y: -0.5 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth * 0.7 || 800;
    let height = container.clientHeight || window.innerHeight * 0.8 || 600;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 280;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Rotating Globe Group
    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = targetRotationRef.current.x;
    globeGroup.rotation.y = targetRotationRef.current.y;
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const GLOBE_RADIUS = 95;

    // 3. Realistic Satellite Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthTexture = createSatelliteEarthTexture(isDark);

    // High-resolution texture loader with procedural fallback
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg",
      (texture) => {
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback procedural satellite texture is already active
      }
    );

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: isDark ? 15 : 25,
      specular: new THREE.Color(isDark ? 0x112233 : 0x334455)
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // 4. Atmospheric Glow Shell
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 1.2, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x60a5fa,
      transparent: true,
      opacity: isDark ? 0.14 : 0.22,
      side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    // Directional sunlight
    const sunLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.4 : 1.6);
    sunLight.position.set(200, 100, 200);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 0.8);
    scene.add(ambientLight);

    // 5. Crisp Small Red Dots for Areas of Alert on 3D Globe
    const interactiveObjects = [];

    (hotspots || []).forEach((h) => {
      if (typeof h.latitude !== "number" || typeof h.longitude !== "number") return;
      if (isNaN(h.latitude) || isNaN(h.longitude)) return;

      const pos = latLonToVector3(h.latitude, h.longitude, GLOBE_RADIUS + 0.35);
      const normal = pos.clone().normalize();

      const markerGroup = new THREE.Group();
      markerGroup.position.copy(pos);

      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(up, normal);
      markerGroup.setRotationFromQuaternion(quaternion);

      const isCritical = h.status === "critical";
      const isWarning = h.status === "warning";
      const isAlert = isCritical || isWarning;

      // Small 3D Core Sphere Dot for Alert Areas
      const dotRadius = isCritical ? 1.1 : isWarning ? 0.9 : 0.65;
      const dotColor = isAlert ? 0xff2222 : 0x10b981;
      
      const dotGeo = new THREE.SphereGeometry(dotRadius, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: dotColor
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.y = dotRadius;
      markerGroup.add(dotMesh);

      // Subtle Outer Red Pulse Ring on Globe Surface
      const ringRadius = dotRadius * 2.2;
      const ringGeo = new THREE.RingGeometry(dotRadius * 1.2, ringRadius, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isAlert ? 0xef4444 : 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isAlert ? 0.75 : 0.45
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.05;
      markerGroup.add(ringMesh);

      // Delicate Vertical Laser Beacon Pin
      if (isAlert) {
        const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.0, 8);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0xff3b30,
          transparent: true,
          opacity: 0.8
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 2.5;
        markerGroup.add(beacon);
      }

      // Generous invisible hit sphere for seamless raycast hovering/clicking
      const hitGeo = new THREE.SphereGeometry(3.2, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.y = 1.0;
      hitMesh.userData = { hotspot: h };
      markerGroup.add(hitMesh);
      interactiveObjects.push(hitMesh);

      globeGroup.add(markerGroup);
    });

    // 6. Interactive Drag & Mouse Orbit Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e) => {
      isDragging = true;
      isAutoRotatingRef.current = false;
      setIsAutoRotating(false);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        if (intersects.length > 0) {
          const hovered = intersects[0].object.userData.hotspot;
          setHoveredHotspot(hovered);
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          container.style.cursor = "pointer";
        } else {
          setHoveredHotspot(null);
          container.style.cursor = isDragging ? "grabbing" : "grab";
        }
      }

      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x = Math.max(-1.2, Math.min(1.2, globeGroup.rotation.x + deltaY * 0.005));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = "grab";
    };

    const onClick = (e) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        if (intersects.length > 0) {
          const clicked = intersects[0].object.userData.hotspot;
          setSelectedHotspotId(clicked.id);
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(160, Math.min(420, camera.position.z + e.deltaY * 0.18));
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("click", onClick);
    container.addEventListener("wheel", onWheel, { passive: false });

    // 7. Render Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotatingRef.current && !isDragging) {
        globeGroup.rotation.y += 0.0012;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Dynamic Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth * 0.7;
      const newH = container.clientHeight || window.innerHeight * 0.8;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };

    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 150);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("click", onClick);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [hotspots, isDark]);

  // Rotate smoothly to selected hotspot when clicked in right feed
  useEffect(() => {
    if (!selectedHotspotId || !globeGroupRef.current) return;
    const target = (hotspots || []).find((h) => h.id === selectedHotspotId);
    if (target) {
      const phi = (target.latitude) * (Math.PI / 180);
      const theta = (-target.longitude - 90) * (Math.PI / 180);

      globeGroupRef.current.rotation.x = phi * 0.8;
      globeGroupRef.current.rotation.y = theta;
    }
  }, [selectedHotspotId, hotspots]);

  // Rotate smoothly to selected country when chosen from dropdown
  useEffect(() => {
    if (!selectedCountry || !globeGroupRef.current) return;
    const [lat, lon] = selectedCountry.center;
    const phi = lat * (Math.PI / 180);
    const theta = (-lon - 90) * (Math.PI / 180);

    globeGroupRef.current.rotation.x = phi * 0.8;
    globeGroupRef.current.rotation.y = theta;
  }, [selectedCountry]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none font-mono transition-colors duration-200 ${
      isDark ? "bg-[#030712]" : "bg-slate-100"
    }`}>
      {/* Country Industries Showcase HUD Drawer */}
      <CountryIndustriesHUD />

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Interactive Hover Telemetry Card */}
      {hoveredHotspot && (
        <div
          className={`absolute z-30 pointer-events-none shadow-2xl rounded-xl p-3 text-xs w-64 backdrop-blur-xl transition-all -translate-x-1/2 -translate-y-full mb-4 ${
            isDark
              ? "bg-slate-950/95 border border-slate-700 text-slate-200"
              : "bg-white/95 border border-slate-300 text-slate-800"
          }`}
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className={`flex items-center justify-between gap-1 mb-1 pb-1 border-b ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}>
            <span className={`font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
              {hoveredHotspot.facilityName || hoveredHotspot.name}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                hoveredHotspot.status === "critical"
                  ? "bg-red-950 text-red-300 border border-red-700"
                  : hoveredHotspot.status === "warning"
                  ? "bg-amber-950 text-amber-300 border border-amber-700"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-700"
              }`}
            >
              {hoveredHotspot.status === "critical" ? "Critical Fire" : "Routine Flare"}
            </span>
          </div>
          <div className={`space-y-1 text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            <div className="flex justify-between">
              <span>Fire Radiative Power:</span>
              <strong className="text-red-500">{hoveredHotspot.frp} MW</strong>
            </div>
            <div className="flex justify-between">
              <span>3&sigma; Baseline Deviation:</span>
              <strong className={hoveredHotspot.frpDeviation > 0 ? "text-red-500" : "text-emerald-500"}>
                +{hoveredHotspot.frpDeviation}%
              </strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Coordinates:</span>
              <span>
                {hoveredHotspot.latitude.toFixed(3)}°, {hoveredHotspot.longitude.toFixed(3)}°
              </span>
            </div>
          </div>
          <div className={`mt-2 pt-1 border-t text-[10px] text-cyan-500 font-semibold text-center flex items-center justify-center gap-1 ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}>
            <span>Click to inspect telemetry</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* TOP-LEFT: Clean Planetary Orbit Toggle */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            const next = !isAutoRotating;
            isAutoRotatingRef.current = next;
            setIsAutoRotating(next);
          }}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-md backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer ${
            isDark
              ? "bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white"
              : "bg-white/90 border-slate-300 text-slate-700 hover:text-slate-900"
          }`}
          title="Toggle Planetary Orbit Rotation"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotating ? "animate-spin text-cyan-500" : ""}`} />
          <span>{isAutoRotating ? "Orbit: ON" : "Orbit: PAUSED"}</span>
        </button>
      </div>

      {/* Recenter Global Overview on Bottom-Right */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={() => {
            if (globeGroupRef.current) {
              globeGroupRef.current.rotation.x = 0.35;
              globeGroupRef.current.rotation.y = -0.5;
            }
          }}
          className={`p-3 rounded-xl shadow-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold border ${
            isDark
              ? "bg-slate-900/90 border-slate-700 text-slate-200 hover:text-white hover:border-cyan-400"
              : "bg-white/90 border-slate-300 text-slate-700 hover:text-slate-900 hover:border-cyan-500"
          }`}
          title="Recenter 3D Globe to Global Prime Perspective"
        >
          <Crosshair className="w-4 h-4 text-cyan-500" />
          <span>RESET GLOBAL VIEW</span>
        </button>
      </div>
    </div>
  );
}
