"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Shield, Sparkles, Activity, Clock, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { MarketPack } from "@/lib/api";
import { RoleDetail } from "@/contexts/RoleContext";

interface HeroCommandBannerProps {
  activePack: MarketPack | null;
  roleDetail: RoleDetail;
  activeLoopsCount: number;
  t1CriticalCount: number;
  slaBreachCount: number;
  closureRate: number;
}

export function HeroCommandBanner({
  activePack,
  roleDetail,
  activeLoopsCount,
  t1CriticalCount,
  slaBreachCount,
  closureRate,
}: HeroCommandBannerProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orbRef.current) return;
    const container = orbRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = 140;
    const height = 140;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Core pulsing crystal sphere
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(1.1, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Ring 1
    const ring1Geo = new THREE.TorusGeometry(2.5, 0.04, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    // Ring 2
    const ring2Geo = new THREE.TorusGeometry(3.0, 0.03, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.5 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // Lighting
    const pointLight = new THREE.PointLight(0xffffff, 2.5, 20);
    pointLight.position.set(3, 4, 5);
    scene.add(pointLight);

    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      coreMesh.rotation.y = elapsed * 0.4;
      coreMesh.rotation.x = elapsed * 0.25;

      ring1.rotation.z = elapsed * 0.5;
      ring1.rotation.x = Math.PI / 3 + Math.sin(elapsed * 0.8) * 0.2;

      ring2.rotation.z = -elapsed * 0.35;
      ring2.rotation.y = Math.PI / 4 + Math.cos(elapsed * 0.7) * 0.2;

      const scale = 1 + Math.sin(elapsed * 2) * 0.05;
      coreMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  // Determine persona-specific configuration
  const roleConfig = React.useMemo(() => {
    switch (roleDetail.id) {
      case "PCP":
        return {
          title: "Ambulatory Origin Care & Prerequisite Desk",
          subtitle: `Dr. Maryam Al-Nuaimi, MD | ${roleDetail.facility}. Intake abnormal screening flags, review clinical diagnostic extractions, and order pre-flight diagnostic prerequisite tests.`,
          badge: "Origin Ambulatory Gateway",
          kpis: [
            {
              label: "Origin Screening Cases",
              value: Math.max(12, Math.floor(activeLoopsCount * 0.55)),
              subtext: "Active Ambulatory Cohort",
              accent: "emerald",
            },
            {
              label: "Missing Prereqs to Clear",
              value: Math.max(2, Math.floor(activeLoopsCount * 0.15)),
              subtext: "1-Click Order Required",
              accent: "amber",
            },
            {
              label: "Pre-Auth Cleared",
              value: Math.max(10, Math.floor(activeLoopsCount * 0.4)),
              subtext: "Referral Gateway Open",
              accent: "cyan",
            },
            {
              label: "Triage Velocity",
              value: "8.4m",
              subtext: "Average Case Triage Time",
              accent: "emerald",
            },
          ],
        };
      case "SPECIALIST":
        return {
          title: "Receiving Specialist & Handshake Clearinghouse",
          subtitle: `Dr. Jonathan Hayes, FRCS | ${roleDetail.facility}. Evaluate 90-second structured e-consult summaries, sign Two-Phase Handshakes, and execute Dual-Key Proof-of-Closure.`,
          badge: "Secondary & Tertiary Receiving Desk",
          kpis: [
            {
              label: "Inbound Handshakes",
              value: Math.max(8, Math.floor(activeLoopsCount * 0.35)),
              subtext: "Pending Specialist Review",
              accent: "cyan",
            },
            {
              label: "90s e-Consult Queue",
              value: Math.max(3, Math.floor(activeLoopsCount * 0.12)),
              subtext: "Instant Synthesis Ready",
              accent: "purple",
            },
            {
              label: "Slot Capacity Booked",
              value: "94%",
              subtext: "Diagnostic Calendar Full",
              accent: "emerald",
            },
            {
              label: "Proof-of-Closure Signed",
              value: Math.max(16, Math.floor(activeLoopsCount * 0.65)),
              subtext: "Cryptographically Verified",
              accent: "emerald",
            },
          ],
        };
      case "NAVIGATOR":
        return {
          title: "Nurse Navigator & Retention Oversight Desk",
          subtitle: `Amina Al-Falasi, RN | ${roleDetail.facility}. Real-time drop-off hazard monitoring, barrier mitigation (rideshare transit vouchers, copay subsidies), and teach-back support.`,
          badge: "Patient Retention & Health Equity",
          kpis: [
            {
              label: "High Hazard Cases (>0.7)",
              value: Math.max(4, Math.floor(activeLoopsCount * 0.18)),
              subtext: "Immediate Interception",
              accent: "rose",
            },
            {
              label: "SDoH Barriers Cleared",
              value: Math.max(14, Math.floor(activeLoopsCount * 0.52)),
              subtext: "Transit & Copay Subsidies",
              accent: "cyan",
            },
            {
              label: "Teach-Back Verified",
              value: "92%",
              subtext: "Multilingual Comprehension",
              accent: "emerald",
            },
            {
              label: "Retained in Care",
              value: "98.6%",
              subtext: "Zero Patients Dropped",
              accent: "emerald",
            },
          ],
        };
      case "PATIENT":
        return {
          title: "Personal Custody Care Path & Companion",
          subtitle: "Sophia Bennett | Empowered Health Journey. Explore 3D anatomical organ explainers, complete conversational comprehension teach-back, and confirm pre-authorized visits.",
          badge: "Patient Portal & Companion",
          kpis: [
            {
              label: "Care Path Status",
              value: "Active",
              subtext: "Continuous Legal Custody",
              accent: "emerald",
            },
            {
              label: "Teach-Back Score",
              value: "92/100",
              subtext: "Comprehension Verified",
              accent: "cyan",
            },
            {
              label: "Insurance Copay",
              value: "AED 0.00",
              subtext: "100% Pre-Authorized",
              accent: "emerald",
            },
            {
              label: "Next Step",
              value: "Confirmed",
              subtext: "Dr. Jonathan Hayes, M42",
              accent: "purple",
            },
          ],
        };
      case "CMO":
      default:
        return {
          title: "Chief Medical Officer Command Center",
          subtitle: "Autonomous Screening-to-Care Loop Closure Platform: Real-time SLA interception, custody state tracking, and health equity telemetry with zero human drop-off.",
          badge: "Macro Population Oversight",
          kpis: [
            {
              label: "Active Loops",
              value: activeLoopsCount,
              subtext: "Continuous Custody",
              accent: "emerald",
            },
            {
              label: "T1 Critical (<2h)",
              value: t1CriticalCount,
              subtext: "Immediate Priority",
              accent: "rose",
            },
            {
              label: "SLA Breaches",
              value: slaBreachCount,
              subtext: slaBreachCount === 0 ? "Zero Breaches Achieved" : "Active Interception",
              accent: "amber",
            },
            {
              label: "Closure Rate",
              value: `${closureRate}%`,
              subtext: "Target > 85% Exceeded",
              accent: "emerald",
            },
          ],
        };
    }
  }, [roleDetail.id, activeLoopsCount, t1CriticalCount, slaBreachCount, closureRate, roleDetail.facility]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 text-slate-900 shadow-xl shadow-slate-200/50">
      {/* Background Kinetic Video Layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none mix-blend-multiply"
      >
        <source src="/assets/Visuals 1.mp4" type="video/mp4" />
      </video>

      {/* Ambient Gradient Specular Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        {/* Left: Brand Identity, 3D Orb & System Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 max-w-3xl">
          {/* 3D Kinetic Holographic Orb Canvas */}
          <div className="relative shrink-0 flex items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-emerald-50/80 via-teal-50/40 to-cyan-50/60 border border-emerald-200/60 shadow-inner">
            <div ref={orbRef} className="w-[140px] h-[140px] cursor-grab active:cursor-grabbing" title="Interactive 3D Custodia Core Telemetry" />
            <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              TELEMETRY LIVE
            </div>
          </div>

          {/* Typography & Regulatory Badges */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>JURISDICTION: {activePack?.name || "UAE Department of Health"}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-2xs">
                Persona: {roleDetail.title}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {roleConfig.badge}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight mt-1">
              {roleConfig.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
              {roleConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Right: 4 Ultra-Realistic Liquid Glass KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-3.5 shrink-0">
          {roleConfig.kpis.map((kpi, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border shadow-md backdrop-blur-xl flex flex-col justify-between hover:shadow-lg transition-all group ${
                kpi.accent === "rose"
                  ? "bg-gradient-to-br from-rose-50/90 to-red-50/50 border-rose-200"
                  : kpi.accent === "amber"
                  ? "bg-gradient-to-br from-amber-50/90 to-orange-50/50 border-amber-200"
                  : kpi.accent === "cyan"
                  ? "bg-gradient-to-br from-cyan-50/90 to-sky-50/50 border-cyan-200"
                  : kpi.accent === "purple"
                  ? "bg-gradient-to-br from-purple-50/90 to-fuchsia-50/50 border-purple-200"
                  : "bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-slate-600">
                <span className="truncate">{kpi.label}</span>
                {kpi.accent === "rose" && <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />}
                {kpi.accent === "amber" && <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform shrink-0" />}
                {kpi.accent === "cyan" && <Sparkles className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform shrink-0" />}
                {kpi.accent === "purple" && <ArrowUpRight className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform shrink-0" />}
                {kpi.accent === "emerald" && <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />}
              </div>
              <div className="mt-2">
                <span
                  className={`text-2xl sm:text-3xl font-mono font-black tracking-tight tabular-nums ${
                    kpi.accent === "rose"
                      ? "text-rose-700"
                      : kpi.accent === "amber"
                      ? "text-amber-800"
                      : kpi.accent === "cyan"
                      ? "text-cyan-800"
                      : kpi.accent === "purple"
                      ? "text-purple-800"
                      : "text-emerald-800"
                  }`}
                >
                  {kpi.value}
                </span>
                <div className="text-[11px] font-bold text-slate-600 mt-1 truncate">
                  {kpi.subtext}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
