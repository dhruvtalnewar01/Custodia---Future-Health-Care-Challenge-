"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ScreeningLoop } from "@/lib/api";
import { CustodyLattice2D } from "./CustodyLattice2D";
import { Maximize2, RotateCcw, Eye, Layers } from "lucide-react";

interface CustodyLattice3DProps {
  loops: ScreeningLoop[];
  selectedLoopId?: string | null;
  onSelectLoop?: (loop: ScreeningLoop) => void;
}

const STAGE_RADII = [4, 7.5, 11, 14.5, 18, 21.5, 25, 28.5];
const STAGE_NAMES = [
  "01: Result Issued",
  "02: Patient Notified",
  "03: Teach-Back Verified",
  "04: Prereq Validated",
  "05: Referral Handshake",
  "06: Custody Transferred",
  "07: Care Delivered",
  "08: Verified Closed",
];

const STATE_INDEX_MAP: Record<string, number> = {
  "1_RESULT_ISSUED": 0,
  "2_PATIENT_NOTIFIED": 1,
  "3_COMPREHENSION_VERIFIED": 2,
  "3_TEACHBACK_COMPLETED": 2,
  "4_PREREQ_VALIDATED": 3,
  "5_REFERRAL_SUBMITTED": 4,
  "5_HANDSHAKE_PENDING": 4,
  "6_HANDSHAKE_ACCEPTED": 5,
  "6_CUSTODY_TRANSFERRED": 5,
  "7_CARE_DELIVERED": 6,
  "7_ENCOUNTER_CONFIRMED": 6,
  "8_VERIFIED_CLOSED": 7,
  "REJECTED_REROUTED": 4,
};

export default function CustodyLattice3D({
  loops,
  selectedLoopId,
  onSelectLoop,
}: CustodyLattice3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [hoveredLoop, setHoveredLoop] = useState<ScreeningLoop | null>(null);

  useEffect(() => {
    if (viewMode !== "3D" || !containerRef.current) return;

    const container = containerRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    // 1. Scene & Camera setup: Professional Clinical White Palette
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F8FAFC");
    scene.fog = new THREE.FogExp2("#F8FAFC", 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 36, 44);
    camera.lookAt(0, 0, 0);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 3. Lighting: Crisp clean clinical illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x059669, 2.5, 100);
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);

    const cyanLight = new THREE.PointLight(0x0284c7, 2, 80);
    cyanLight.position.set(20, 10, -20);
    scene.add(cyanLight);

    // 4. Center Core Nucleus
    const coreGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 5. Build 8 Orbital Custody Rings
    STAGE_RADII.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.06, r + 0.06, 128);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 7 ? 0x059669 : 0xcbd5e1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45 + idx * 0.05,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      scene.add(ringMesh);
    });

    // 6. Build Interactive Patient Nodes
    const nodeGroup = new THREE.Group();
    const nodeMeshes: { mesh: THREE.Mesh; loop: ScreeningLoop }[] = [];

    loops.forEach((loop) => {
      const stageIdx = STATE_INDEX_MAP[loop.current_state] ?? 0;
      const radius = STAGE_RADII[stageIdx] ?? 4;

      const sameStageLoops = loops.filter((l) => (STATE_INDEX_MAP[l.current_state] ?? 0) === stageIdx);
      const posIdx = sameStageLoops.indexOf(loop);
      const angle = ((posIdx + 1) / (sameStageLoops.length + 1)) * Math.PI * 2 + (stageIdx * 0.4);

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Acuity 3D Elevation
      let y = 0;
      let colorHex = 0x2563eb;
      let emissiveHex = 0x1d4ed8;
      let size = 0.55;

      if (loop.acuity_tier === "TIER_1_CRITICAL") {
        y = 2.4;
        colorHex = 0xe11d48;
        emissiveHex = 0xff1744;
        size = 0.75;
      } else if (loop.acuity_tier === "TIER_2_HIGH") {
        y = 1.1;
        colorHex = 0xd97706;
        emissiveHex = 0xf59e0b;
        size = 0.65;
      }

      if (loop.current_state === "8_VERIFIED_CLOSED") {
        colorHex = 0x059669;
        emissiveHex = 0x10b981;
        y = 0.4;
      }

      const sphereGeo = new THREE.SphereGeometry(size, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: emissiveHex,
        emissiveIntensity: 0.6,
        roughness: 0.25,
        metalness: 0.5,
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(x, y, z);
      nodeGroup.add(sphereMesh);
      nodeMeshes.push({ mesh: sphereMesh, loop });

      if (y > 0) {
        const pillarGeo = new THREE.CylinderGeometry(0.04, 0.04, y, 8);
        const pillarMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.45,
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, y / 2, z);
        nodeGroup.add(pillar);
      }
    });

    scene.add(nodeGroup);

    // 7. Interactive Arcs connecting consecutive referral paths
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.7,
    });

    if (nodeMeshes.length >= 2) {
      const p1 = nodeMeshes[0].mesh.position;
      const p2 = nodeMeshes[Math.min(3, nodeMeshes.length - 1)].mesh.position;
      const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      midPoint.y += 4.5;

      const curve = new THREE.QuadraticBezierCurve3(p1, midPoint, p2);
      const points = curve.getPoints(50);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcLine = new THREE.Line(arcGeo, arcMaterial);
      scene.add(arcLine);
    }

    // 8. Orbit Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 55, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCameraPos = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));

        if (intersects.length > 0) {
          const hit = nodeMeshes.find((n) => n.mesh === intersects[0].object);
          if (hit) setHoveredLoop(hit.loop);
        } else {
          setHoveredLoop(null);
        }
        return;
      }

      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - dy * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      spherical.radius = Math.max(20, Math.min(95, spherical.radius + e.deltaY * 0.05));
      updateCameraPos();
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));

      if (intersects.length > 0) {
        const hit = nodeMeshes.find((n) => n.mesh === intersects[0].object);
        if (hit && onSelectLoop) {
          onSelectLoop(hit.loop);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("wheel", onWheel, { passive: true });
    domEl.addEventListener("click", onClick);

    // 9. Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        nodeGroup.rotation.y = elapsed * 0.03;
      }

      nodeMeshes.forEach(({ mesh, loop }) => {
        if (loop.acuity_tier === "TIER_1_CRITICAL") {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.5 + Math.sin(elapsed * 4) * 0.4;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 10. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel);
      domEl.removeEventListener("click", onClick);
      window.removeEventListener("resize", handleResize);
      if (domEl.parentNode) domEl.parentNode.removeChild(domEl);
      renderer.dispose();
    };
  }, [viewMode, loops, onSelectLoop]);

  if (viewMode === "2D") {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setViewMode("3D")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-xs font-bold text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Switch to 3D WebGL Lattice</span>
          </button>
        </div>
        <CustodyLattice2D loops={loops} selectedLoopId={selectedLoopId} onSelectLoop={onSelectLoop} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-200/90 bg-[#F8FAFC] shadow-sm">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setViewMode("2D")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 text-xs font-extrabold text-slate-800 border border-slate-200/90 hover:bg-slate-50 backdrop-blur-md transition-colors shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>[2D Vector Topology]</span>
        </button>
      </div>

      {/* Orbit Rings Stage Legend: Clean White Card */}
      <div className="absolute top-4 left-4 z-20 hidden md:flex flex-col gap-1.5 bg-white/95 p-3.5 rounded-2xl border border-slate-200/90 shadow-md backdrop-blur-md">
        <div className="text-xs font-mono font-black text-slate-700 uppercase tracking-wider mb-0.5">
          8 Orbital Custody Rings
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> 01: Result Issued
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 02: Notified
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> 03: Teach-Back
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 04: Prereqs
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> 05: Handshake
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> 06: Transferred
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> 07: Delivered
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300" /> 08: Verified Closed
          </div>
        </div>
      </div>

      {/* Acuity Elevation Legend: Clean White Card */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-4 bg-white/95 px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-md backdrop-blur-md text-xs font-mono font-bold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200 animate-pulse" />
          <span className="text-rose-700">Tier 1 Critical (+2.4m Elevation)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200" />
          <span className="text-amber-700">Tier 2 High (+1.1m)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-blue-700">Tier 3 Routine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span className="text-emerald-700">Verified Closed</span>
        </div>
      </div>

      {/* Hovered Loop Details Card Tooltip: Clean White Card */}
      {hoveredLoop && (
        <div className="absolute bottom-4 right-4 z-30 w-80 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-black text-slate-900">{hoveredLoop.loop_code}</span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-md font-extrabold ${
                hoveredLoop.acuity_tier === "TIER_1_CRITICAL"
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : hoveredLoop.acuity_tier === "TIER_2_HIGH"
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}
            >
              {hoveredLoop.acuity_tier}
            </span>
          </div>
          <div className="text-sm text-slate-800 font-bold">{hoveredLoop.finding_category}</div>
          <div className="text-xs text-slate-600 font-medium flex items-center justify-between">
            <span>State: {hoveredLoop.current_state}</span>
            <span className="font-mono text-emerald-600 font-bold">Score: {hoveredLoop.comprehension_score}/100</span>
          </div>
          <div className="text-xs text-slate-500 font-mono truncate">
            Facility: {hoveredLoop.custody_facility}
          </div>
          <div className="text-xs text-emerald-700 font-bold pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Click node to inspect case workstation</span>
            <span>&rarr;</span>
          </div>
        </div>
      )}
    </div>
  );
}
