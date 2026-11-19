"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  Stethoscope,
  UserCheck,
  Compass,
  HeartPulse,
  ArrowRight,
} from "lucide-react";
import { useRole, UserRole } from "@/contexts/RoleContext";
import { DotMatrixHandsCanvas } from "./DotMatrixHandsCanvas";

interface PersonaConfig {
  id: UserRole;
  title: string;
  badge: string;
  subtitle: string;
  icon: React.ElementType;
  accentHex: string;
  destination: string;
}

const PERSONA_GATEWAYS: PersonaConfig[] = [
  {
    id: "CMO",
    title: "Chief Medical Officer",
    badge: "Executive",
    subtitle: "Macro population health, SLA breach interception, and k-anonymity equity audits.",
    icon: Activity,
    accentHex: "#059669",
    destination: "/command",
  },
  {
    id: "PCP",
    title: "Primary Care Attending",
    badge: "Origin Gateway",
    subtitle: "Intake abnormal screening flags, review diagnostic extractions, and order STAT diagnostic tests.",
    icon: Stethoscope,
    accentHex: "#0D9488",
    destination: "/intake",
  },
  {
    id: "SPECIALIST",
    title: "Receiving Specialist",
    badge: "Receiver Desk",
    subtitle: "Review 90-second e-consult cards, sign handshakes, and commit Proof-of-Closure.",
    icon: UserCheck,
    accentHex: "#4F46E5",
    destination: "/workstation",
  },
  {
    id: "NAVIGATOR",
    title: "Nurse Navigator",
    badge: "Retention Desk",
    subtitle: "Monitor survival drop-off hazards, clear transport barriers, and support teach-back.",
    icon: Compass,
    accentHex: "#9333EA",
    destination: "/command",
  },
  {
    id: "PATIENT",
    title: "Patient / Partner",
    badge: "Care Portal",
    subtitle: "Explore 3D anatomical explainers, live clinical chat, and pre-authorized booking.",
    icon: HeartPulse,
    accentHex: "#2563EB",
    destination: "/companion/LOOP-UAE-401",
  },
];

export function PersonaLoginHero() {
  const router = useRouter();
  const { setRole } = useRole();
  const [selectedRole, setSelectedRole] = useState<UserRole>("CMO");
  const [isEntering, setIsEntering] = useState(false);

  const activeConfig =
    PERSONA_GATEWAYS.find((p) => p.id === selectedRole) || PERSONA_GATEWAYS[0];

  const handleEnterGateway = (config: PersonaConfig) => {
    setIsEntering(true);
    setRole(config.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("custodia-role", config.id);
    }
    setTimeout(() => {
      router.push(config.destination);
    }, 450);
  };

  return (
    <section className="relative w-full h-screen min-h-[760px] overflow-hidden bg-[#f7f7f5] text-[#111111] select-none flex flex-col items-center justify-start font-sans px-4 sm:px-6">
      {/* 1. Live Creation-of-Adam Dot-Matrix Hands Canvas (Reaching in lower viewport, 100% unobstructed) */}
      <DotMatrixHandsCanvas />

      {/* 2. Brand Identity Header Anchor */}
      <div className="relative z-10 pt-7 sm:pt-8 flex items-center gap-2.5">
        <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center shadow-xs border border-slate-800">
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
          <span className="font-bold text-[14px] tracking-tight text-[#111111]">
            CUSTODIA
          </span>
        </div>
      </div>

      {/* 3. Headline & Subline */}
      <div className="relative z-10 mt-3 sm:mt-4 text-center max-w-2xl mx-auto px-4">
        <h1 className="font-semibold tracking-[-0.035em] leading-[1.08] text-[clamp(26px,2.6vw,42px)]">
          <span className="text-[#9a9a9a]">Autonomous Clinical Custody. </span>
          <span className="text-[#111111]">Screening-to-Care Closed Loops.</span>
        </h1>
        <p className="mt-2 text-[#7b7b7b] text-[clamp(12px,0.88vw,13.5px)] leading-[1.4] font-normal max-w-lg mx-auto">
          Deterministic custody state machine terminating patient drop-off across cancer and metabolic screening. Select your verified clinical persona to enter your active desk.
        </p>
      </div>

      {/* 4. The 5 Clinical Persona Category Cards (Restored from previous design with refined typography & spacing) */}
      <div className="relative z-10 w-full max-w-6xl mt-5 sm:mt-6 flex lg:grid lg:grid-cols-5 gap-3.5 px-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {PERSONA_GATEWAYS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedRole === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedRole(p.id)}
              onDoubleClick={() => handleEnterGateway(p)}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 text-left min-w-[220px] lg:min-w-0 snap-center ${
                isSelected
                  ? "bg-white/95 border-2 border-slate-900 shadow-xl shadow-slate-900/10 scale-[1.02] ring-4 ring-slate-900/5"
                  : "bg-white/80 hover:bg-white/95 border border-slate-200/90 hover:border-slate-400 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Header: Icon + Badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700"
                  }`}
                  style={{
                    backgroundColor: isSelected ? p.accentHex : undefined,
                    color: isSelected ? "#ffffff" : p.accentHex,
                  }}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                    isSelected
                      ? "bg-slate-100 text-slate-800"
                      : "bg-slate-100/70 text-slate-500"
                  }`}
                >
                  {p.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-[13.5px] font-bold text-[#111111] tracking-tight leading-snug">
                  {p.title}
                </h3>
                <p className="text-[11px] text-[#71717a] font-normal leading-relaxed mt-1 line-clamp-2">
                  {p.subtitle}
                </p>
              </div>

              {/* Footer Status Link */}
              <div className="pt-2 border-t border-slate-100/90 flex items-center justify-between text-[10px] font-mono font-bold">
                <span
                  style={{ color: isSelected ? p.accentHex : undefined }}
                  className={isSelected ? "font-extrabold" : "text-slate-400"}
                >
                  {isSelected ? "Active Persona ✓" : "Click to select"}
                </span>
                <ArrowRight
                  className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                    isSelected ? "text-slate-900" : "text-slate-400"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Signature Rainbow Underglow CTA Button */}
      <div className="relative inline-block mt-5 sm:mt-6 group z-10">
        {/* Rainbow Glow */}
        <div
          className="absolute left-[10%] right-[10%] -bottom-1 h-3.5 rounded-full pointer-events-none transition-all duration-300 opacity-85 blur-[10px] group-hover:opacity-100 group-hover:blur-[14px]"
          style={{
            background:
              "linear-gradient(90deg, #ffcf5a, #7dffa8, #5ad7ff, #9b7bff, #ff6fd8, #ffb36b)",
          }}
        />

        {/* Action Button */}
        <button
          onClick={() => handleEnterGateway(activeConfig)}
          disabled={isEntering}
          className="relative z-10 inline-flex items-center gap-2 bg-[#111111] text-white text-[13.5px] font-medium px-7 py-3 rounded-full hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 shadow-md cursor-pointer disabled:opacity-75"
        >
          <span>
            {isEntering
              ? `Entering ${activeConfig.title}...`
              : `Enter Terminal as ${activeConfig.title}`}
          </span>
          <ArrowRight className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Notice: No top bar and no bottom partner logos footer rendered */}
    </section>
  );
}
