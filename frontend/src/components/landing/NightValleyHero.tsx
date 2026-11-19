"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import * as THREE from "three";

interface ValleyEngine {
  startHoverTransition: () => void;
  stopHoverTransition: () => void;
  toggleSound: () => boolean;
  isMuted: () => boolean;
  destroy: () => void;
}

export function NightValleyHero() {
  const router = useRouter();
  const valleyContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ValleyEngine | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  useEffect(() => {
    if (!valleyContainerRef.current) return;

    const container = valleyContainerRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const canvasContainer = document.createElement("div");
    canvasContainer.className = "js-canvas-container absolute inset-0 w-full h-full";
    container.appendChild(canvasContainer);

    // Initialize 3D Engine
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020409);
    scene.fog = new THREE.FogExp2(0x020409, 0.016);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    canvasContainer.appendChild(renderer.domElement);

    // Camera Spline Path (Wandering loop through night flower valley)
    const splinePoints = [
      new THREE.Vector3(0, 4.5, 45),
      new THREE.Vector3(18, 3.2, 25),
      new THREE.Vector3(26, 6.0, -5),
      new THREE.Vector3(8, 3.8, -35),
      new THREE.Vector3(-16, 5.2, -60),
      new THREE.Vector3(-28, 4.0, -30),
      new THREE.Vector3(-14, 3.0, 0),
      new THREE.Vector3(0, 4.5, 45),
    ];
    const cameraSpline = new THREE.CatmullRomCurve3(splinePoints, true, "centripetal");

    // Valley Terrain
    const terrainGeo = new THREE.PlaneGeometry(240, 240, 80, 80);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const distFromCenter = Math.abs(vx);
      const ridge = Math.sin(vx * 0.05) * 4.0 + Math.cos(vz * 0.04) * 3.5;
      const ravine = Math.exp(-Math.pow(vx / 18, 2)) * -3.5;
      const heightVal = Math.sin(vx * 0.08) * Math.cos(vz * 0.06) * 2.5 + ridge * 0.6 + ravine;
      posAttr.setY(i, heightVal - 1.5);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x07111a,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // Procedural Point Sprite Canvas Textures
    const createFlowerTexture = () => {
      const size = 128;
      const cvs = document.createElement("canvas");
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext("2d")!;
      const center = size / 2;

      // Soft glow
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.2, "rgba(94, 234, 212, 0.95)");
      grad.addColorStop(0.5, "rgba(16, 185, 129, 0.45)");
      grad.addColorStop(0.85, "rgba(5, 150, 105, 0.12)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // 5 Glowing Petals
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      for (let p = 0; p < 5; p++) {
        const ang = (p * Math.PI * 2) / 5;
        const px = center + Math.cos(ang) * 16;
        const py = center + Math.sin(ang) * 16;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden Stamen Center
      ctx.fillStyle = "#ffeb99";
      ctx.beginPath();
      ctx.arc(center, center, 6, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(cvs);
    };

    const flowerTexture = createFlowerTexture();

    // Thousands of Glowing Bioluminescent Flowers
    const FLOWER_COUNT = 4800;
    const flowerGeo = new THREE.BufferGeometry();
    const flowerPositions = new Float32Array(FLOWER_COUNT * 3);
    const flowerBasePositions = new Float32Array(FLOWER_COUNT * 3);
    const flowerVelocities = new Float32Array(FLOWER_COUNT * 3);
    const flowerColors = new Float32Array(FLOWER_COUNT * 3);
    const flowerScales = new Float32Array(FLOWER_COUNT);

    const palette = [
      new THREE.Color(0x10b981), // Emerald
      new THREE.Color(0x14b8a6), // Teal
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0x818cf8), // Soft Indigo
      new THREE.Color(0xc084fc), // Amethyst
      new THREE.Color(0xfde047), // Starlight Gold
      new THREE.Color(0xf5efe2), // Cream White
    ];

    for (let i = 0; i < FLOWER_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.pow(Math.random(), 0.75) * 90;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Sample terrain elevation
      const ridge = Math.sin(x * 0.05) * 4.0 + Math.cos(z * 0.04) * 3.5;
      const ravine = Math.exp(-Math.pow(x / 18, 2)) * -3.5;
      const groundY = Math.sin(x * 0.08) * Math.cos(z * 0.06) * 2.5 + ridge * 0.6 + ravine - 1.2;

      const y = groundY + Math.random() * 0.45;

      flowerPositions[i * 3] = x;
      flowerPositions[i * 3 + 1] = y;
      flowerPositions[i * 3 + 2] = z;

      flowerBasePositions[i * 3] = x;
      flowerBasePositions[i * 3 + 1] = y;
      flowerBasePositions[i * 3 + 2] = z;

      // Outward dispersion velocities for hover transition
      const outDir = new THREE.Vector3(x, y + 8, z).normalize();
      flowerVelocities[i * 3] = outDir.x * (8 + Math.random() * 14);
      flowerVelocities[i * 3 + 1] = outDir.y * (10 + Math.random() * 18);
      flowerVelocities[i * 3 + 2] = outDir.z * (8 + Math.random() * 14);

      const col = palette[Math.floor(Math.random() * palette.length)];
      flowerColors[i * 3] = col.r;
      flowerColors[i * 3 + 1] = col.g;
      flowerColors[i * 3 + 2] = col.b;

      flowerScales[i] = 0.7 + Math.random() * 0.9;
    }

    flowerGeo.setAttribute("position", new THREE.BufferAttribute(flowerPositions, 3));
    flowerGeo.setAttribute("color", new THREE.BufferAttribute(flowerColors, 3));

    const flowerMat = new THREE.PointsMaterial({
      size: 1.8,
      map: flowerTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const flowerPoints = new THREE.Points(flowerGeo, flowerMat);
    scene.add(flowerPoints);

    // Atmospheric Stardust & Ambient Pollen
    const DUST_COUNT = 1200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 160;
      dustPositions[i * 3 + 1] = Math.random() * 32;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.45,
      color: 0xf5efe2,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Celestial Moonlight & Lighting
    const moonLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    moonLight.position.set(40, 80, 50);
    scene.add(moonLight);

    const ambientLight = new THREE.AmbientLight(0x06121f, 1.2);
    scene.add(ambientLight);

    // Interactive State
    let scrollProgress = 0.02;
    let targetScrollProgress = 0.02;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let hoverTransition = 0.0;
    let targetHoverTransition = 0.0;
    let isTouchActive = false;
    let lastTouchY = 0;

    // Web Audio Synthesizer (Zero-dependency, offline, harmonic ambient pad)
    let audioCtx: AudioContext | null = null;
    let masterGain: GainNode | null = null;
    let filterNode: BiquadFilterNode | null = null;
    let isMuted = true;

    const initAudio = () => {
      if (audioCtx) return;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();

        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = "lowpass";
        filterNode.frequency.setValueAtTime(10000, audioCtx.currentTime);
        filterNode.Q.setValueAtTime(1.8, audioCtx.currentTime);

        masterGain.connect(filterNode);
        filterNode.connect(audioCtx.destination);

        // Drone Oscillators (A1 root 55Hz, E2 82.4Hz, A3 220Hz, C#4 277.18Hz, E4 329.63Hz)
        const freqs = [55, 82.4, 220, 277.18, 329.63, 440];
        freqs.forEach((f, idx) => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const oscGain = audioCtx.createGain();
          osc.type = idx === 0 ? "sine" : idx === 1 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(f, audioCtx.currentTime);

          // Detune slightly for lush chorus
          osc.detune.setValueAtTime((idx - 2) * 5, audioCtx.currentTime);

          const vol = idx < 2 ? 0.14 : 0.035;
          oscGain.gain.setValueAtTime(vol, audioCtx.currentTime);

          osc.connect(oscGain);
          oscGain.connect(masterGain!);
          osc.start();
        });
      } catch (err) {
        console.warn("AudioContext unavailable:", err);
      }
    };

    const toggleSound = (): boolean => {
      initAudio();
      if (!audioCtx || !masterGain) return false;
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      isMuted = !isMuted;
      const now = audioCtx.currentTime;
      if (isMuted) {
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      } else {
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.8);
      }
      setIsPlayingSound(!isMuted);
      return !isMuted;
    };

    // Event Listeners
    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY * 0.00035;
      targetScrollProgress = (targetScrollProgress + delta + 1) % 1;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isTouchActive = true;
        lastTouchY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchActive || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const delta = (lastTouchY - currentY) * 0.0022; // 20x mobile touch multiplier
      targetScrollProgress = (targetScrollProgress + delta + 1) % 1;
      lastTouchY = currentY;
    };

    const onTouchEnd = () => {
      isTouchActive = false;
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", onResize);

    // Hover Transition Controls
    const startHoverTransition = () => {
      targetHoverTransition = 1.0;
      if (audioCtx && filterNode && !isMuted) {
        const now = audioCtx.currentTime;
        filterNode.frequency.cancelScheduledValues(now);
        filterNode.frequency.setValueAtTime(filterNode.frequency.value, now);
        filterNode.frequency.exponentialRampToValueAtTime(380, now + 0.7); // Muffled lowpass
      }
    };

    const stopHoverTransition = () => {
      targetHoverTransition = 0.0;
      if (audioCtx && filterNode && !isMuted) {
        const now = audioCtx.currentTime;
        filterNode.frequency.cancelScheduledValues(now);
        filterNode.frequency.setValueAtTime(filterNode.frequency.value, now);
        filterNode.frequency.exponentialRampToValueAtTime(10000, now + 0.9); // Full range
      }
    };

    engineRef.current = {
      startHoverTransition,
      stopHoverTransition,
      toggleSound,
      isMuted: () => isMuted,
      destroy: () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("resize", onResize);
        if (audioCtx) {
          audioCtx.close().catch(() => {});
        }
        renderer.dispose();
      },
    };

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();
    let introTriggered = false;

    // Report loaded after 3 frames of compilation
    let frameCount = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      frameCount++;
      if (frameCount === 3) {
        setLoaded(true);
      }
      if (frameCount === 18 && !introTriggered) {
        introTriggered = true;
        setUiVisible(true);
      }

      // Smooth state lerps
      hoverTransition += (targetHoverTransition - hoverTransition) * (delta * 3.5);
      mouseX += (targetMouseX - mouseX) * (delta * 4.0);
      mouseY += (targetMouseY - mouseY) * (delta * 4.0);

      // Idle forward drift (eased to stop during hover transition)
      const forwardSpeed = (1.0 - hoverTransition) * 0.018 * delta;
      targetScrollProgress = (targetScrollProgress + forwardSpeed) % 1;
      scrollProgress += (targetScrollProgress - scrollProgress) * (delta * 4.0);

      // Camera along spline
      const splineT = (scrollProgress + 1) % 1;
      const camPos = cameraSpline.getPointAt(splineT);
      const lookAtPos = cameraSpline.getPointAt((splineT + 0.035) % 1);

      // Mouse camera tilt
      camera.position.set(
        camPos.x + mouseX * 2.2,
        camPos.y + mouseY * 1.5,
        camPos.z
      );

      lookAtPos.x += mouseX * 4.5;
      lookAtPos.y += mouseY * 3.0;
      camera.lookAt(lookAtPos);

      // Update Flower Dispersal & Blooming
      const posArray = flowerGeo.attributes.position.array as Float32Array;
      const disp = hoverTransition;

      for (let i = 0; i < FLOWER_COUNT; i++) {
        const i3 = i * 3;
        const bx = flowerBasePositions[i3];
        const by = flowerBasePositions[i3 + 1];
        const bz = flowerBasePositions[i3 + 2];

        // Base wave flutter
        const wave = Math.sin(elapsed * 1.8 + bx * 0.1 + bz * 0.1) * 0.08;

        // Dispersal vector
        const vx = flowerVelocities[i3] * disp;
        const vy = flowerVelocities[i3 + 1] * disp + Math.sin(elapsed * 2.0 + i) * 0.8 * disp;
        const vz = flowerVelocities[i3 + 2] * disp;

        // Mouse repulsion in 3D world space
        const dx = bx - camera.position.x;
        const dz = bz - camera.position.z;
        const distToCam = Math.hypot(dx, dz);

        posArray[i3] = bx + vx;
        posArray[i3 + 1] = by + wave + vy;
        posArray[i3 + 2] = bz + vz;
      }
      flowerGeo.attributes.position.needsUpdate = true;

      // Dust particles drift
      const dustArray = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < DUST_COUNT; i++) {
        const i3 = i * 3;
        dustArray[i3 + 1] += delta * 0.35;
        if (dustArray[i3 + 1] > 32) {
          dustArray[i3 + 1] = 0.5;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  const handleGoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  const handleEnterTerminal = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-[#f5efe2] select-none font-sans">
      <style jsx global>{`
        :root {
          --u: min(calc(100vw / 1600), calc(100vh / 900));
          --cream: #f5efe2;
        }
        @media (max-width: 820px) {
          :root {
            --u: min(calc(100vw / 640), calc(100vh / 840));
          }
        }
      `}</style>

      {/* 1. 3D WebGL Night Flower Valley Mount */}
      <div id="valley" ref={valleyContainerRef} className="fixed inset-0 z-0 pointer-events-auto" aria-hidden="true" />

      {/* 2. Top-Level UI Layer */}
      <div
        id="ui"
        className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-1000 ease-out ${
          uiVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header Bar */}
        <header
          className="absolute left-0 right-0 top-0 flex items-center justify-between"
          style={{
            padding: "calc(24 * var(--u)) calc(44 * var(--u)) 0",
          }}
        >
          {/* Brand Wordmark */}
          <Link
            href="/"
            className="pointer-events-auto flex items-center gap-2 group cursor-pointer"
            aria-label="CUSTODIA"
          >
            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
              <Image
                src="/assets/LOGO.gif"
                alt="CUSTODIA"
                width={28}
                height={28}
                className="w-full h-full object-cover mix-blend-screen scale-110"
                unoptimized
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-medium tracking-[-0.02em] text-[#f5efe2]"
                style={{ fontSize: "calc(26 * var(--u))" }}
              >
                CUSTODIA
              </span>
            </div>
          </Link>

          {/* Right Navigation & Action Pill */}
          <nav
            aria-label="Main"
            className="flex items-center"
            style={{
              gap: "calc(44 * var(--u))",
              fontSize: "calc(14.5 * var(--u))",
              letterSpacing: ".16em",
            }}
          >
            <div className="hidden md:flex items-center gap-[calc(44*var(--u))] uppercase font-medium">
              <span className="pointer-events-auto hover:opacity-60 transition-opacity cursor-pointer">
                Autonomous Custody
              </span>
              <span className="pointer-events-auto hover:opacity-60 transition-opacity cursor-pointer">
                8-Stage State Machine
              </span>
              <span className="pointer-events-auto hover:opacity-60 transition-opacity cursor-pointer">
                Dual-Key Proof
              </span>
              <span className="pointer-events-auto hover:opacity-60 transition-opacity cursor-pointer">
                Ledger
              </span>
            </div>

            {/* Cream Action Pill strictly navigating to /login */}
            <button
              onClick={handleEnterTerminal}
              className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-[#f5efe2] text-[#151510] font-medium tracking-normal hover:-translate-y-[1px] transition-transform cursor-pointer shadow-md"
              style={{
                height: "calc(46 * var(--u))",
                padding: "0 calc(26 * var(--u))",
                fontSize: "calc(14 * var(--u))",
              }}
            >
              Enter Terminal
            </button>
          </nav>
        </header>

        {/* Centerpiece Hero Block */}
        <section
          className="absolute left-0 right-0 top-1/2 flex flex-col items-center text-center -translate-y-[46%]"
        >
          {/* Headline in Antonio 400 at 158u */}
          <h1
            className="font-normal uppercase tracking-[-0.012em] whitespace-nowrap text-[#f5efe2] drop-shadow-sm select-none px-4"
            style={{
              fontFamily: 'Antonio, "Arial Narrow", sans-serif',
              fontSize: "clamp(32px, min(calc(158 * var(--u)), 11.5vw), 170px)",
              lineHeight: 0.92,
            }}
          >
            Grown, not built.
          </h1>

          {/* Caption */}
          <p
            className="text-[#f5efe2]/90 font-medium leading-[1.3] text-center max-w-lg px-4"
            style={{
              marginTop: "calc(48 * var(--u))",
              fontSize: "clamp(16px, calc(20 * var(--u)), 22px)",
            }}
          >
            Rooted in clinical custody.
            <br />
            Built for screening-to-care loop closure.
          </p>

          {/* Circular 58u Arrow Button routing strictly to /login */}
          <a
            href="/login"
            id="go"
            onClick={handleGoClick}
            onPointerEnter={() => engineRef.current?.startHoverTransition()}
            onPointerLeave={() => engineRef.current?.stopHoverTransition()}
            className="pointer-events-auto grid place-items-center rounded-full border border-[#f5efe2] text-[#f5efe2] hover:bg-[#f5efe2] hover:text-[#151510] transition-colors duration-300 cursor-pointer shadow-lg group mt-[calc(34*var(--u))]"
            style={{
              width: "calc(58 * var(--u))",
              height: "calc(58 * var(--u))",
              borderWidth: "1.5px",
            }}
            aria-label="Enter Clinical Gateway"
          >
            <svg
              className="fill-none stroke-current stroke-[1.6] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:translate-x-0.5"
              style={{
                width: "calc(22 * var(--u))",
                height: "calc(22 * var(--u))",
              }}
              viewBox="0 0 24 24"
            >
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </a>
        </section>

        {/* Bottom Right Corner: Scroll To Wander & Ambient Sound Toggle */}
        <div
          className="absolute flex items-center select-none"
          style={{
            right: "calc(44 * var(--u))",
            bottom: "calc(44 * var(--u))",
            gap: "calc(18 * var(--u))",
            fontSize: "calc(12.5 * var(--u))",
            letterSpacing: ".16em",
          }}
        >
          <span className="uppercase font-medium opacity-80 text-[11px] sm:text-[calc(12.5*var(--u))]">
            Scroll to wander
          </span>
          <i
            style={{
              width: "1px",
              height: "calc(26 * var(--u))",
              backgroundColor: "rgba(245, 239, 226, 0.45)",
            }}
          />

          {/* Sound Toggle Button */}
          <button
            id="sound"
            onClick={() => engineRef.current?.toggleSound()}
            className="pointer-events-auto grid place-items-center cursor-pointer hover:opacity-75 transition-opacity"
            style={{
              width: "calc(28 * var(--u))",
              height: "calc(28 * var(--u))",
            }}
            aria-pressed={isPlayingSound}
            aria-label="Toggle Ambient Audio"
          >
            <svg
              className="w-full h-full fill-none stroke-current stroke-[1.5] stroke-linecap-round stroke-linejoin-round"
              viewBox="0 0 24 24"
            >
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
              {/* Sound waves when playing */}
              {isPlayingSound ? (
                <>
                  <path d="M15.5 9a4 4 0 0 1 0 6" />
                  <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                </>
              ) : (
                /* Muted X */
                <path d="m16 10 4 4m0-4-4 4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Black Fullscreen Initial Loading Veil with Pulsing Cream Dot */}
      <div
        id="loader"
        className={`fixed inset-0 z-30 grid place-items-center bg-black transition-opacity duration-1000 ease-out pointer-events-none ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <span
          className="rounded-full bg-[#f5efe2] animate-pulse"
          style={{
            width: "calc(9 * var(--u))",
            height: "calc(9 * var(--u))",
            minWidth: "6px",
            minHeight: "6px",
          }}
        />
      </div>
    </div>
  );
}
