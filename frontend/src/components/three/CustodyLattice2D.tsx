"use client";

import React from "react";
import { ScreeningLoop } from "@/lib/api";

interface CustodyLattice2DProps {
  loops: ScreeningLoop[];
  selectedLoopId?: string | null;
  onSelectLoop?: (loop: ScreeningLoop) => void;
}

const STAGES = [
  { key: "1_RESULT_ISSUED", label: "01: Result Issued", radius: 50 },
  { key: "2_PATIENT_NOTIFIED", label: "02: Notified", radius: 95 },
  { key: "3_COMPREHENSION_VERIFIED", label: "03: Comprehension", radius: 140 },
  { key: "4_PREREQ_VALIDATED", label: "04: Prereq Validated", radius: 185 },
  { key: "5_REFERRAL_SUBMITTED", label: "05: Handshake", radius: 230 },
  { key: "6_HANDSHAKE_ACCEPTED", label: "06: Custody Transferred", radius: 275 },
  { key: "7_CARE_DELIVERED", label: "07: Care Delivered", radius: 320 },
  { key: "8_VERIFIED_CLOSED", label: "08: Verified Closed", radius: 365 },
];

export function CustodyLattice2D({
  loops,
  selectedLoopId,
  onSelectLoop,
}: CustodyLattice2DProps) {
  const stateIndexMap: Record<string, number> = {
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

  return (
    <div className="relative w-full h-[540px] flex items-center justify-center overflow-hidden bg-white rounded-3xl border border-slate-200/90 shadow-sm">
      <svg
        viewBox="0 0 840 840"
        className="w-full h-full max-w-[800px] max-h-[800px] select-none"
      >
        <defs>
          <radialGradient id="latticeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#2563EB" stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <circle cx="420" cy="420" r="390" fill="url(#latticeGlow)" />

        {/* 8 Orbital Custody Rings */}
        {STAGES.map((st, i) => (
          <g key={st.key}>
            <circle
              cx="420"
              cy="420"
              r={st.radius}
              fill="none"
              stroke={i === 7 ? "#059669" : "#CBD5E1"}
              strokeWidth={i === 7 ? "2" : "1.2"}
              strokeDasharray={i % 2 === 1 ? "4 4" : undefined}
              opacity={0.6 + i * 0.05}
            />
            {/* Stage Label Text along ring */}
            <text
              x="420"
              y={420 - st.radius - 5}
              textAnchor="middle"
              className="text-[10px] font-mono fill-slate-500 font-bold"
            >
              {st.label}
            </text>
          </g>
        ))}

        {/* Center Nucleus */}
        <circle cx="420" cy="420" r="14" fill="#059669" opacity="0.25" />
        <circle cx="420" cy="420" r="6" fill="#059669" />

        {/* Active Patient Nodes */}
        {loops.map((loop, idx) => {
          const stageIdx = stateIndexMap[loop.current_state] ?? 0;
          const radius = STAGES[stageIdx]?.radius ?? 50;

          const countInState = loops.filter(
            (l) => stateIndexMap[l.current_state] === stageIdx
          ).length;
          const posInState = loops
            .filter((l) => stateIndexMap[l.current_state] === stageIdx)
            .indexOf(loop);

          const angle =
            ((posInState + 1) / (countInState + 1)) * Math.PI * 2 +
            idx * 0.15;
          const cx = 420 + Math.cos(angle) * radius;
          const cy = 420 + Math.sin(angle) * radius;

          const isSelected = selectedLoopId === loop.id || selectedLoopId === loop.loop_code;

          let nodeColor = "#2563EB";
          if (loop.acuity_tier === "TIER_1_CRITICAL") nodeColor = "#E11D48";
          else if (loop.acuity_tier === "TIER_2_HIGH") nodeColor = "#D97706";
          if (loop.current_state === "8_VERIFIED_CLOSED") nodeColor = "#059669";

          return (
            <g
              key={loop.id}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => onSelectLoop && onSelectLoop(loop)}
            >
              {isSelected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r="14"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  className="animate-ping opacity-60"
                />
              )}
              {loop.acuity_tier === "TIER_1_CRITICAL" && (
                <circle
                  cx={cx}
                  cy={cy}
                  r="10"
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="1.5"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isSelected ? "8" : "6"}
                fill={nodeColor}
                filter="url(#glow)"
                stroke="#FFFFFF"
                strokeWidth={isSelected ? "2" : "1.5"}
              />
              <text
                x={cx}
                y={cy + 17}
                textAnchor="middle"
                className="text-[9px] font-mono fill-slate-700 font-extrabold"
              >
                {loop.loop_code.replace("LOOP-", "")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 2D Vector Overlay Badge */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm backdrop-blur-md">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono font-bold text-slate-800">
          2D Vector Topology : {loops.length} Monitored Custody Loops
        </span>
      </div>
    </div>
  );
}
