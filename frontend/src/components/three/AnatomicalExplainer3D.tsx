"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Info, RotateCw, ZoomIn, ShieldCheck, Activity } from "lucide-react";

interface AnatomicalExplainer3DProps {
  category: string;
  className?: string;
}

interface ExplainerAnnotation {
  title: string;
  description: string;
  badge: string;
}

export default function AnatomicalExplainer3D({
  category,
  className = "h-[360px]",
}: AnatomicalExplainer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotation, setAnnotation] = useState<ExplainerAnnotation>({
    title: "Screening Visualization",
    description: "Visualizing anatomical screening target to support clinical comprehension.",
    badge: "Screening Flag (Not Diagnosis)",
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F8FAFC");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const tealLight = new THREE.PointLight(0x059669, 2.5, 30);
    tealLight.position.set(5, 5, 5);
    scene.add(tealLight);

    const cyanLight = new THREE.PointLight(0x0284c7, 2, 30);
    cyanLight.position.set(-5, -3, 3);
    scene.add(cyanLight);

    // 4. Procedural Geometry based on finding_category
    const modelGroup = new THREE.Group();
    const cat = (category || "").toUpperCase();

    if (cat.includes("BREAST") || cat.includes("BIRADS")) {
      setAnnotation({
        title: "Upper Outer Quadrant Localization",
        description: "Screening identified focal tissue asymmetry requiring targeted ultrasound confirmation.",
        badge: "Screening Flag: BI-RADS 4 (Not Diagnosis)",
      });

      // Breast hemisphere contour
      const breastGeo = new THREE.SphereGeometry(2.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const breastMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const breastMesh = new THREE.Mesh(breastGeo, breastMat);
      breastMesh.rotation.x = -Math.PI / 2;
      modelGroup.add(breastMesh);

      // Inner soft tissue volume
      const innerGeo = new THREE.SphereGeometry(2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const innerMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.65,
        roughness: 0.4,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.rotation.x = -Math.PI / 2;
      modelGroup.add(innerMesh);

      // 4 Quadrant Cross Dividers
      const lineMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.7 });
      const hLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-2.2, 0, 0),
        new THREE.Vector3(2.2, 0, 0),
      ]);
      const vLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -2.2, 0),
        new THREE.Vector3(0, 2.2, 0),
      ]);
      modelGroup.add(new THREE.Line(hLineGeo, lineMat));
      modelGroup.add(new THREE.Line(vLineGeo, lineMat));

      // Focal Target Node (Upper-Outer Quadrant)
      const targetGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const targetMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.9,
      });
      const targetMesh = new THREE.Mesh(targetGeo, targetMat);
      targetMesh.position.set(0.9, 0.9, 0.8);
      modelGroup.add(targetMesh);

      // Halo ring around target
      const haloGeo = new THREE.RingGeometry(0.45, 0.52, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(0.9, 0.9, 0.8);
      haloMesh.rotation.x = 0.2;
      modelGroup.add(haloMesh);

    } else if (cat.includes("GENOMIC") || cat.includes("HBB") || cat.includes("THALASSEMIA")) {
      setAnnotation({
        title: "Beta-Globin (HBB) Allele Locus",
        description: "Visualizing Chromosome 11p15.4 variant status. Autosomal recessive carrier flag.",
        badge: "Genomic Carrier Screening (Asymptomatic)",
      });

      // Procedural Double-Helix DNA
      const turns = 3;
      const pointsPerTurn = 24;
      const totalPoints = turns * pointsPerTurn;
      const radius = 1.2;
      const height = 4.4;

      const strand1Points: THREE.Vector3[] = [];
      const strand2Points: THREE.Vector3[] = [];

      for (let i = 0; i < totalPoints; i++) {
        const t = (i / totalPoints) * turns * Math.PI * 2;
        const y = (i / totalPoints) * height - height / 2;
        const x1 = Math.cos(t) * radius;
        const z1 = Math.sin(t) * radius;
        const x2 = Math.cos(t + Math.PI) * radius;
        const z2 = Math.sin(t + Math.PI) * radius;

        strand1Points.push(new THREE.Vector3(x1, y, z1));
        strand2Points.push(new THREE.Vector3(x2, y, z2));

        // Base pair rungs every 2 points
        if (i % 2 === 0) {
          const rungGeo = new THREE.CylinderGeometry(0.04, 0.04, radius * 2, 8);
          const isLocus = i >= 30 && i <= 36;
          const rungMat = new THREE.MeshStandardMaterial({
            color: isLocus ? 0xec4899 : 0x06b6d4,
            emissive: isLocus ? 0xdb2777 : 0x0891b2,
            emissiveIntensity: isLocus ? 0.9 : 0.4,
          });
          const rung = new THREE.Mesh(rungGeo, rungMat);
          rung.position.set(0, y, 0);
          rung.rotation.z = Math.PI / 2;
          rung.rotation.y = -t;
          modelGroup.add(rung);
        }
      }

      // Strand 1 line
      const curve1 = new THREE.CatmullRomCurve3(strand1Points);
      const tubeGeo1 = new THREE.TubeGeometry(curve1, 64, 0.08, 8, false);
      const tubeMat1 = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.3 });
      modelGroup.add(new THREE.Mesh(tubeGeo1, tubeMat1));

      // Strand 2 line
      const curve2 = new THREE.CatmullRomCurve3(strand2Points);
      const tubeGeo2 = new THREE.TubeGeometry(curve2, 64, 0.08, 8, false);
      const tubeMat2 = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.5, roughness: 0.3 });
      modelGroup.add(new THREE.Mesh(tubeGeo2, tubeMat2));

    } else if (cat.includes("COLON") || cat.includes("FIT") || cat.includes("COLORECTAL")) {
      setAnnotation({
        title: "Colonic Mucosal Architecture",
        description: "Positive immunochemical test indicates micro-trace occult hemoglobin across haustra folds.",
        badge: "Screening FIT Positive: Diagnostic Colonoscopy Indicated",
      });

      // Procedural Colon Segment with Haustra Bulges
      const colonPoints: THREE.Vector3[] = [];
      const colonLength = 4.2;
      for (let i = 0; i <= 24; i++) {
        const y = (i / 24) * colonLength - colonLength / 2;
        const x = Math.sin(i * 0.4) * 0.4;
        colonPoints.push(new THREE.Vector3(x, y, 0));
      }

      const colonCurve = new THREE.CatmullRomCurve3(colonPoints);
      const colonTubeGeo = new THREE.TubeGeometry(colonCurve, 32, 0.95, 16, false);
      const colonTubeMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      modelGroup.add(new THREE.Mesh(colonTubeGeo, colonTubeMat));

      // Inner haustra rings
      for (let j = -2; j <= 2; j += 0.8) {
        const ringGeo = new THREE.TorusGeometry(0.9, 0.12, 12, 24);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          roughness: 0.4,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, j, 0);
        ringMesh.rotation.x = Math.PI / 2;
        modelGroup.add(ringMesh);
      }

      // Focal Target Marker
      const markerGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const markerMat = new THREE.MeshStandardMaterial({
        color: 0xe11d48,
        emissive: 0xbe123c,
        emissiveIntensity: 0.9,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(0.7, 0.4, 0.4);
      modelGroup.add(markerMesh);

    } else {
      // Default: Renal Glomerular Filtration & Metabolic Unit
      setAnnotation({
        title: "Renal Microvascular Filtration Unit",
        description: "Glomerular capillary loops showing metabolic filtration load and podocyte boundary status.",
        badge: "Screening Flag: Metabolic Acuity (Not Irreversible Failure)",
      });

      // Glomerular Core Sphere with wireframe
      const renalGeo = new THREE.SphereGeometry(1.6, 24, 24);
      const renalMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      modelGroup.add(new THREE.Mesh(renalGeo, renalMat));

      // Capillary convolutions
      for (let k = 0; k < 6; k++) {
        const knotGeo = new THREE.TorusGeometry(0.9 + k * 0.08, 0.08, 12, 32);
        const knotMat = new THREE.MeshStandardMaterial({
          color: k % 2 === 0 ? 0x3b82f6 : 0x10b981,
          metalness: 0.4,
          roughness: 0.4,
        });
        const knotMesh = new THREE.Mesh(knotGeo, knotMat);
        knotMesh.rotation.set(k * 0.6, k * 0.9, k * 0.4);
        modelGroup.add(knotMesh);
      }

      // Arteriolar inlet and outlet
      const inletGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 12);
      const inletMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x9f1239, emissiveIntensity: 0.4 });
      const inletMesh = new THREE.Mesh(inletGeo, inletMat);
      inletMesh.position.set(-1.2, -1.8, 0);
      inletMesh.rotation.z = -0.3;
      modelGroup.add(inletMesh);

      const outletGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 12);
      const outletMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4 });
      const outletMesh = new THREE.Mesh(outletGeo, outletMat);
      outletMesh.position.set(1.2, -1.8, 0);
      outletMesh.rotation.z = 0.3;
      modelGroup.add(outletMesh);
    }

    scene.add(modelGroup);

    // 5. Mouse Drag Control
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      modelGroup.rotation.y += dx * 0.01;
      modelGroup.rotation.x += dy * 0.01;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // 6. Animation
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        modelGroup.rotation.y = elapsed * 0.18;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      if (dom.parentNode) dom.parentNode.removeChild(dom);
      renderer.dispose();
    };
  }, [category]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-sm ${className}`}>
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Clinical Reassurance Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-emerald-300 text-emerald-800 text-[11px] font-mono font-bold shadow-xs backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {annotation.badge}
        </span>
      </div>

      {/* Top Right Controls Hint */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-[10px] font-mono text-slate-600 bg-white/90 px-2.5 py-1 rounded-md border border-slate-200 shadow-xs backdrop-blur-md font-bold">
        <RotateCw className="w-3 h-3 text-slate-500 animate-spin-slow" />
        <span>Drag to rotate</span>
      </div>

      {/* Bottom Educational Callout */}
      <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 border border-slate-200 p-3 rounded-xl shadow-md backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 mb-0.5">
          <Activity className="w-3.5 h-3.5 text-cyan-600" />
          {annotation.title}
        </div>
        <p className="text-xs text-slate-600 font-medium leading-snug">
          {annotation.description}
        </p>
      </div>
    </div>
  );
}
