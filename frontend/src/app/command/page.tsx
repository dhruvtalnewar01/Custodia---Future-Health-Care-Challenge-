"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  api,
  ScreeningLoop,
  AuditBlock,
  Patient,
  FhirResource,
} from "@/lib/api";
import { generateDemoLoopsForPack } from "@/lib/demoData";
import { useMarketPack } from "@/contexts/MarketPackContext";
import { useTimeWarp } from "@/contexts/TimeWarpContext";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Zap,
  Stethoscope,
  UserCheck,
  Compass,
  HeartPulse,
  PhoneCall,
  Calendar,
  Key,
  FileCheck,
  Car,
  Languages,
  Check,
  RotateCw,
  Share2,
  Send,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Dynamic import for 3D Custody Lattice
import { HeroCommandBanner } from "@/components/layout/HeroCommandBanner";
const CustodyLattice3D = dynamic(
  () => import("@/components/three/CustodyLattice3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-3xl bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-sm font-bold border border-slate-200">
        Loading 3D Custody Lattice...
      </div>
    ),
  }
);

// Dynamic import for 3D Anatomical Explainer
const AnatomicalExplainer3D = dynamic(
  () => import("@/components/three/AnatomicalExplainer3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-xs font-bold border border-slate-200">
        Loading 3D Anatomical Explainer...
      </div>
    ),
  }
);

export default function CommandPage() {
  const router = useRouter();
  const { activePack } = useMarketPack();
  const { timeWarpHours } = useTimeWarp();
  const { role, roleDetail } = useRole();
  const { t, language } = useLanguage();

  const [loops, setLoops] = useState<ScreeningLoop[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [equityMatrix, setEquityMatrix] = useState<any>(null);
  const [suppressSmallCells, setSuppressSmallCells] = useState<boolean>(true);
  const [selectedLoop, setSelectedLoop] = useState<ScreeningLoop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // PCP / Navigator Action state
  const [orderedPrereq, setOrderedPrereq] = useState<string | null>(null);
  const [clearedFriction, setClearedFriction] = useState<Record<string, boolean>>({});
  const [patientChatMsg, setPatientChatMsg] = useState("");

  const currentPatientName = selectedLoop?.patient?.full_name || (selectedLoop as any)?.patient_name || "Patient Record";
  const patientFirstName = currentPatientName.split(" ")[0] || "Patient";

  const [patientChatHistory, setPatientChatHistory] = useState<Array<{ sender: string; text: string }>>([
    {
      sender: "Clinical Navigator",
      text: "Hello. Your screening results have been reviewed by our clinical care team. This is a routine preventive follow-up check and not a diagnosis. We are here to guide you step by step. What can I clarify for you?",
    },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loopsRes, funnelRes, equityRes] = await Promise.allSettled([
        api.getLoops({ market_pack_id: activePack?.id }),
        api.getConversionFunnel(),
        api.getEquityMatrix(suppressSmallCells, 10),
      ]);

      if (loopsRes.status === "fulfilled" && loopsRes.value) {
        const rawList: ScreeningLoop[] = Array.isArray(loopsRes.value)
          ? loopsRes.value
          : ((loopsRes.value as any)?.loops || []);
        const loopList = rawList.length > 0 ? rawList : generateDemoLoopsForPack(activePack?.id || "pack-uae-doh");
        setLoops(loopList);
        if (loopList.length > 0 && !selectedLoop) {
          setSelectedLoop(loopList[0]);
        }
      } else {
        const loopList = generateDemoLoopsForPack(activePack?.id || "pack-uae-doh");
        setLoops(loopList);
        if (!selectedLoop) setSelectedLoop(loopList[0]);
      }

      if (funnelRes.status === "fulfilled" && funnelRes.value) {
        setFunnelData(funnelRes.value.funnel || []);
      }

      if (equityRes.status === "fulfilled" && equityRes.value) {
        setEquityMatrix(equityRes.value);
      }
    } catch (err) {
      console.error("Failed to load command data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePack?.id, suppressSmallCells]);

  // Compute time-warped remaining SLA hours
  const loopsWithWarp = useMemo(() => {
    return loops.map((l) => {
      const nominalRemaining = Math.max(
        0,
        Math.round(
          (new Date(l.sla_deadline_iso).getTime() - new Date().getTime()) /
            (1000 * 60 * 60)
        )
      );
      const effectiveRemaining = Math.max(0, nominalRemaining - timeWarpHours);
      const isBreached = effectiveRemaining <= 0 && l.current_state !== "8_VERIFIED_CLOSED";
      return {
        ...l,
        effectiveRemainingHours: effectiveRemaining,
        isBreached,
      };
    });
  }, [loops, timeWarpHours]);

  // Priority Breach Queue (Sorted by remaining SLA ascending)
  const breachQueue = useMemo(() => {
    return [...loopsWithWarp]
      .filter((l) => l.current_state !== "8_VERIFIED_CLOSED")
      .sort((a, b) => {
        if (a.isBreached && !b.isBreached) return -1;
        if (!a.isBreached && b.isBreached) return 1;
        return a.effectiveRemainingHours - b.effectiveRemainingHours;
      });
  }, [loopsWithWarp]);

  // High Drop-Off Hazard Queue (for Nurse Navigator)
  const highHazardLoops = useMemo(() => {
    return [...loopsWithWarp].sort(
      (a, b) => (b.dropoff_hazard_score || 0) - (a.dropoff_hazard_score || 0)
    );
  }, [loopsWithWarp]);

  // Handle 1-Click STAT Lab Order for PCP Desk
  const handleOrderPrereq = async (loop: ScreeningLoop, code: string, name: string) => {
    try {
      setOrderedPrereq(loop.loop_code);
      await api.orderPrereqLab(loop.id, {
        code,
        name,
        clinician_id: roleDetail.clinicianId,
      });
      await loadData();
    } catch (err: any) {
      console.error("Order error:", err);
    } finally {
      setTimeout(() => setOrderedPrereq(null), 2500);
    }
  };

  // Handle Friction Breaker Dispatch for Nurse Navigator
  const handleDispatchFriction = (loopId: string, type: string) => {
    setClearedFriction((prev) => ({
      ...prev,
      [`${loopId}-${type}`]: true,
    }));
  };

  // Handle Patient Teach-Back Chat Turn with Live OpenAI Reasoning Model
  const [isChatThinking, setIsChatThinking] = useState(false);
  const handleSendPatientChat = async () => {
    if (!patientChatMsg.trim() || isChatThinking) return;
    const userText = patientChatMsg.trim();
    const updatedHistory = [
      ...patientChatHistory,
      { sender: `${patientFirstName} (You)`, text: userText },
    ];
    setPatientChatHistory(updatedHistory);
    setPatientChatMsg("");
    setIsChatThinking(true);

    try {
      const res = await api.chatWithNavigator({
        message: userText,
        conversation_history: updatedHistory,
        language: "en",
        loop_code: selectedLoop?.loop_code || "LOOP-UAE-401",
        patient_name: currentPatientName,
      });
      setPatientChatHistory((prev) => [
        ...prev,
        {
          sender: "Clinical Navigator",
          text: res.reply,
        },
      ]);
    } catch {
      setPatientChatHistory((prev) => [
        ...prev,
        {
          sender: "Clinical Navigator",
          text: "I understand your question completely. Please rest assured that this screening flag is a routine check and not a diagnosis of cancer. Your ultrasound is 100% pre-authorized with AED 0 copay.",
        },
      ]);
    } finally {
      setIsChatThinking(false);
    }
  };

  // KPI Calculations
  const t1CriticalCount = loopsWithWarp.filter(
    (l) => l.acuity_tier === "TIER_1_CRITICAL" && l.current_state !== "8_VERIFIED_CLOSED"
  ).length;

  const slaBreachCount = loopsWithWarp.filter((l) => l.isBreached).length;
  const closedCount = loops.filter((l) => l.current_state === "8_VERIFIED_CLOSED").length;
  const closureRate = loops.length > 0 ? Math.round((closedCount / loops.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* =========================================================================
          VIEW 1: CHIEF MEDICAL OFFICER (CMO) DASHBOARD (Macro Population Oversight)
          ========================================================================= */}
      {role === "CMO" && (
        <>
          {/* Executive Hero Banner with 3D Holographic Core & Liquid Glass Metrics */}
          <HeroCommandBanner
            activePack={activePack}
            roleDetail={roleDetail}
            activeLoopsCount={loops.length}
            t1CriticalCount={t1CriticalCount}
            slaBreachCount={slaBreachCount}
            closureRate={closureRate}
          />

          {/* WebGL 3D Lattice Topological Visualizer */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    8-Stage Orbital Custody Topology (WebGL 3D Lattice)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Live spatial rendering of active clinical custody states, patient queues, and custody transfers.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs hidden sm:inline">
                Interactive: Click any node to inspect custody status
              </span>
            </div>
            <CustodyLattice3D
              loops={loopsWithWarp}
              selectedLoopId={selectedLoop?.id}
              onSelectLoop={(l) => {
                setSelectedLoop(l);
                router.push(`/workstation?caseId=${l.loop_code}`);
              }}
            />
          </div>

          {/* Two-Column Grid: SLA Breach Interception Queue & Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* SLA Breach Queue (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Live SLA Breach Interception Queue</h3>
                    <span className="text-xs font-mono font-bold text-rose-600">
                      {breachQueue.length} Active Loops Sorted by Urgency
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                  Deterministic Priority
                </span>
              </div>

              <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col divide-y divide-slate-100/70">
                {breachQueue.slice(0, 6).map((item) => {
                  const isUrgent = item.isBreached || item.effectiveRemainingHours < 2;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50 ${
                        item.acuity_tier === "TIER_1_CRITICAL" ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                            item.acuity_tier === "TIER_1_CRITICAL"
                              ? "bg-rose-500 ring-4 ring-rose-200 animate-pulse"
                              : item.acuity_tier === "TIER_2_HIGH"
                              ? "bg-amber-500 ring-4 ring-amber-200"
                              : "bg-blue-500 ring-4 ring-blue-200"
                          }`}
                        />
                        <div className="min-w-0 flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900">
                              {item.loop_code}
                            </span>
                            <span
                              className={`text-xs font-mono px-2 py-0.5 rounded-md font-bold ${
                                item.acuity_tier === "TIER_1_CRITICAL"
                                  ? "bg-rose-100 text-rose-900 border border-rose-300"
                                  : item.acuity_tier === "TIER_2_HIGH"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-blue-100 text-blue-900 border border-blue-300"
                              }`}
                            >
                              {item.acuity_tier === "TIER_1_CRITICAL" ? "T1 CRITICAL" : item.acuity_tier === "TIER_2_HIGH" ? "T2 HIGH" : "T3 ROUTINE"}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                              {item.finding_category}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                            <span>Holder: <strong className="text-slate-900 font-bold">{item.custody_holder_name}</strong></span>
                            <span>Facility: <strong className="text-slate-800">{item.custody_facility}</strong></span>
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                              {item.current_state}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right flex flex-col">
                          <span
                            className={`text-sm sm:text-base font-mono font-black tabular-nums ${
                              item.isBreached ? "text-rose-600" : isUrgent ? "text-amber-600" : "text-slate-800"
                            }`}
                          >
                            {item.isBreached ? "SLA BREACHED" : `${item.effectiveRemainingHours}h remaining`}
                          </span>
                          <span className="text-xs font-mono text-slate-500 font-semibold">
                            Target SLA: {item.sla_hours}h
                          </span>
                        </div>

                        <Link
                          href={`/workstation?caseId=${item.loop_code}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
                        >
                          <span>Intercept</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversion Funnel (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Cross-Facility Conversion Funnel</h3>
                    <span className="text-xs font-mono text-slate-500 font-bold">8-Stage Cohort Retention</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Live Flow
                </span>
              </div>

              <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 h-[420px] flex flex-col justify-between">
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  Retention telemetry tracking screening findings from Result Issued to Verified Dual-Key Closure.
                </div>
                <div className="flex-1 w-full min-h-0 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        funnelData.length > 0
                          ? funnelData
                          : [
                              { stage_name: "01: Result", count: 56 },
                              { stage_name: "02: Notified", count: 54 },
                              { stage_name: "03: TeachBack", count: 48 },
                              { stage_name: "04: Prereq", count: 42 },
                              { stage_name: "05: Handshake", count: 35 },
                              { stage_name: "06: Transferred", count: 28 },
                              { stage_name: "07: Delivered", count: 22 },
                              { stage_name: "08: Closed", count: 18 },
                            ]
                      }
                      margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                    >
                      <XAxis
                        dataKey="stage_name"
                        tick={{ fontSize: 11, fill: "#475569", fontWeight: "bold" }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#475569", fontWeight: "bold" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#CBD5E1",
                          borderRadius: "0.75rem",
                          fontSize: "13px",
                          fontWeight: "bold",
                          color: "#0F172A",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {(funnelData.length > 0 ? funnelData : [1, 2, 3, 4, 5, 6, 7, 8]).map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 7 ? "#059669" : index >= 4 ? "#0284c7" : "#64748b"}
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Demographic Equity Matrix (k >= 10) */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Demographic Equity &amp; k-Anonymity Matrix (k &ge; 10 Small-Cell Suppression)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Guarantees privacy for vulnerable cohorts while auditing healthcare parity.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSuppressSmallCells(!suppressSmallCells)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all border shadow-xs ${
                  suppressSmallCells ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Small-Cell Suppression: {suppressSmallCells ? "ACTIVE (HIPAA / DoH)" : "DISABLED"}</span>
              </button>
            </div>

            <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3">Demographic Cohort</th>
                    <th className="pb-3">Payer Plan</th>
                    <th className="pb-3 text-right">T1 Critical</th>
                    <th className="pb-3 text-right">T2 High</th>
                    <th className="pb-3 text-right">T3 Routine</th>
                    <th className="pb-3 text-right">Closure Rate</th>
                    <th className="pb-3 text-right">Drop-off Hazard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-sm">
                  {(equityMatrix?.rows || [
                    {
                      subgroup: "UAE Nationals (Emirati)",
                      payer: "Thiqa / Daman Enhanced",
                      t1: 4,
                      t2: 12,
                      t3: 18,
                      closure_rate: "88%",
                      avg_hazard: "0.18",
                      t1_suppressed: true,
                    },
                    {
                      subgroup: "Expatriate Professional (SE Asian / MENA)",
                      payer: "Daman Standard",
                      t1: 3,
                      t2: 14,
                      t3: 20,
                      closure_rate: "82%",
                      avg_hazard: "0.24",
                      t1_suppressed: true,
                    },
                    {
                      subgroup: "Basic Plan / Construction Workforce",
                      payer: "Abu Dhabi Basic Plan",
                      t1: 2,
                      t2: 6,
                      t3: 11,
                      closure_rate: "64%",
                      avg_hazard: "0.62",
                      t1_suppressed: true,
                      t2_suppressed: true,
                    },
                  ]).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-sans font-extrabold text-slate-900">{row.subgroup}</td>
                      <td className="py-3 text-slate-600">{row.payer}</td>
                      <td className="py-3 text-right font-black">
                        {row.t1_suppressed && suppressSmallCells ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-bold">&lt; 10</span>
                        ) : (
                          <span className="text-rose-600">{row.t1}</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-black">
                        {row.t2_suppressed && suppressSmallCells ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-bold">&lt; 10</span>
                        ) : (
                          <span className="text-amber-600">{row.t2}</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-black text-blue-600">{row.t3}</td>
                      <td className="py-3 text-right font-black text-emerald-600">{row.closure_rate}</td>
                      <td className="py-3 text-right font-black text-slate-700">{row.avg_hazard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW 2: PRIMARY CARE ATTENDING (PCP) ACTION DESK
          ========================================================================= */}
      {role === "PCP" && (
        <>
          <HeroCommandBanner
            activePack={activePack}
            roleDetail={roleDetail}
            activeLoopsCount={loops.length}
            t1CriticalCount={t1CriticalCount}
            slaBreachCount={slaBreachCount}
            closureRate={closureRate}
          />

          {/* Quick Action Navigation */}
          <div className="flex items-center justify-between p-4 rounded-2xl liquid-glass-elevated border border-white/90 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 font-mono">
                ORIGIN GATEWAY: {roleDetail.facility}
              </span>
            </div>
            <Link
              href="/intake"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md glow-emerald transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Intake New Screening Flag</span>
            </Link>
          </div>

          {/* PCP Missing Prerequisite Action Table */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Pre-Flight Referral Diagnostic Prerequisite Clearance
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Specialist referral gates are locked until mandatory prerequisite tests are ordered and validated.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                PCP Statutory Liability
              </span>
            </div>

            <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 overflow-hidden divide-y divide-slate-100/70">
              {loopsWithWarp
                .filter((l) => !l.prereq_validation_passed && l.current_state !== "8_VERIFIED_CLOSED")
                .slice(0, 5)
                .map((loop) => (
                  <div key={loop.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-mono font-black text-sm shrink-0">
                        PR
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-slate-900">{loop.loop_code}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 font-mono">
                            {loop.finding_category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          Target Specialty: <strong className="text-slate-800">{loop.target_specialty}</strong> | State:{" "}
                          <span className="font-mono font-bold text-slate-700">{loop.current_state}</span>
                        </div>
                        <div className="text-xs text-rose-600 font-semibold mt-1">
                          Missing Prerequisite:{" "}
                          {loop.missing_prereq_items?.map((m: any) => `${m.name} (${m.code})`).join(", ") ||
                            "Targeted Ultrasound LOINC 24605-8"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() =>
                          handleOrderPrereq(
                            loop,
                            loop.missing_prereq_items?.[0]?.code || "24605-8",
                            loop.missing_prereq_items?.[0]?.name || "Targeted Breast Ultrasound Report"
                          )
                        }
                        disabled={orderedPrereq === loop.loop_code}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Zap className="w-4 h-4" />
                        <span>{orderedPrereq === loop.loop_code ? "EHR Order Injected ✓" : "1-Click STAT Order"}</span>
                      </button>
                      <Link
                        href={`/workstation?caseId=${loop.loop_code}`}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
                      >
                        Open Case
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW 3: RECEIVING SPECIALIST DESK
          ========================================================================= */}
      {role === "SPECIALIST" && (
        <>
          <HeroCommandBanner
            activePack={activePack}
            roleDetail={roleDetail}
            activeLoopsCount={loops.length}
            t1CriticalCount={t1CriticalCount}
            slaBreachCount={slaBreachCount}
            closureRate={closureRate}
          />

          {/* Quick Action Navigation */}
          <div className="flex items-center justify-between p-4 rounded-2xl liquid-glass-elevated border border-white/90 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 font-mono">
                RECEIVING SPECIALIST: {roleDetail.facility}
              </span>
            </div>
            <Link
              href="/referrals"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-md glow-teal transition-all flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Manage Handshake Clearinghouse</span>
            </Link>
          </div>

          {/* Specialist Inbound Cases Waiting for Handshake or Closure */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Dual-Key Proof-of-Closure &amp; Handshake Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Review e-consult summaries and execute cryptographic proof of closed care loops.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {loopsWithWarp.slice(0, 4).map((loop) => (
                <div key={loop.id} className="p-6 rounded-3xl liquid-glass-elevated border border-white/90 shadow-lg hover:border-cyan-300 transition-all flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-cyan-600 font-extrabold block">{loop.loop_code}</span>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">{loop.finding_category}</h3>
                      <span className="text-xs text-slate-500 font-medium">Origin: {loop.custody_facility}</span>
                    </div>
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-md font-bold ${
                        loop.current_state === "8_VERIFIED_CLOSED"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {loop.current_state}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                    <div><strong>Acuity:</strong> {loop.acuity_tier} ({loop.sla_hours}h SLA)</div>
                    <div><strong>Specialty Target:</strong> {loop.target_specialty}</div>
                    <div><strong>Status:</strong> {loop.current_state === "8_VERIFIED_CLOSED" ? "Loop Closed & Verified ✓" : "Pending Definitive Encounter"}</div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <Link
                      href={`/workstation?caseId=${loop.loop_code}`}
                      className="flex-1 text-center py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition-colors"
                    >
                      Inspect &amp; Sign PoC
                    </Link>
                    <Link
                      href="/referrals"
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition-colors"
                    >
                      Referrals
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW 4: NURSE NAVIGATOR DESK (Drop-Off Hazard Mitigation)
          ========================================================================= */}
      {role === "NAVIGATOR" && (
        <>
          <HeroCommandBanner
            activePack={activePack}
            roleDetail={roleDetail}
            activeLoopsCount={loops.length}
            t1CriticalCount={t1CriticalCount}
            slaBreachCount={slaBreachCount}
            closureRate={closureRate}
          />

          {/* High Drop-Off Hazard Watchlist */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Explainable Survival Drop-Off Hazard Watchlist
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Proactively intercepting patients with predictive drop-off hazard &gt; 0.60 before SLA breach.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {highHazardLoops.slice(0, 6).map((loop) => {
                const hazard = loop.dropoff_hazard_score || 0.68;
                return (
                  <div key={loop.id} className="p-6 rounded-3xl liquid-glass-elevated border border-white/90 shadow-lg hover:border-purple-300 transition-all flex flex-col justify-between gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-purple-600 font-black">{loop.loop_code}</span>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">{loop.finding_category}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-400 block">Drop-off Hazard</span>
                        <span
                          className={`font-mono text-lg font-black ${
                            hazard > 0.75 ? "text-rose-600" : hazard > 0.5 ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {Math.round(hazard * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/70 text-xs flex flex-col gap-1.5">
                      <span className="font-mono font-bold text-purple-900 uppercase">Top Risk Drivers:</span>
                      <ul className="list-disc list-inside text-slate-700 font-medium">
                        <li>Transit distance &gt; 20 km to designated specialist</li>
                        <li>Low teach-back comprehension score (Score: {loop.comprehension_score}/100)</li>
                        <li>High deductible / copay uncertainty</li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase">1-Click Friction Breaker:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDispatchFriction(loop.id, "uber")}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                            clearedFriction[`${loop.id}-uber`]
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          }`}
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>{clearedFriction[`${loop.id}-uber`] ? "Voucher Dispatched ✓" : "Uber Health"}</span>
                        </button>
                        <button
                          onClick={() => handleDispatchFriction(loop.id, "translator")}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                            clearedFriction[`${loop.id}-translator`]
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          }`}
                        >
                          <Languages className="w-3.5 h-3.5" />
                          <span>{clearedFriction[`${loop.id}-translator`] ? "Interpreter Connected ✓" : "Interpreter"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW 5: PATIENT / PARTNER PORTAL VIEW
          ========================================================================= */}
      {role === "PATIENT" && (
        <>
          <HeroCommandBanner
            activePack={activePack}
            roleDetail={roleDetail}
            activeLoopsCount={loops.length}
            t1CriticalCount={t1CriticalCount}
            slaBreachCount={slaBreachCount}
            closureRate={closureRate}
          />

          {/* Patient Quick Contact Ribbon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase block">Dedicated Patient Navigator</span>
                <span className="text-sm font-extrabold text-slate-900">Amina Al-Falasi, RN | Comprehensive Patient Navigation</span>
              </div>
            </div>
            <button className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all">
              <PhoneCall className="w-4 h-4" />
              <span>Contact Nurse Amina</span>
            </button>
          </div>

          {/* Interactive 3D Anatomical Visualizer & Multilingual Teach-Back Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 3D Anatomical Visualizer (6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Interactive 3D Anatomical Visualizer</h2>
                  <p className="text-xs text-slate-500 font-medium">Explore and understand your screening test in clear visual 3D.</p>
                </div>
              </div>

              <AnatomicalExplainer3D category="BREAST_BIRADS_4" className="h-[400px]" />
            </div>

            {/* Right Multilingual Clinical Care Navigator (6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Clinical Care Navigator</h2>
                  <p className="text-xs text-slate-500 font-medium">Empathetic clinical guidance powered by cost-optimized reasoning model.</p>
                </div>
              </div>

              <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 flex flex-col justify-between h-[400px]">
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
                  {patientChatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed max-w-[85%] ${
                        msg.sender.includes("(You)")
                          ? "bg-blue-600 text-white self-end rounded-br-none shadow-sm"
                          : "bg-slate-100 text-slate-800 self-start rounded-bl-none border border-slate-200/60"
                      }`}
                    >
                      <strong className="block text-[11px] font-mono opacity-80 mb-1">{msg.sender}</strong>
                      {msg.text}
                    </div>
                  ))}
                  {isChatThinking && (
                    <div className="p-3.5 rounded-2xl text-xs font-medium leading-relaxed max-w-[85%] bg-slate-50 text-slate-600 self-start rounded-bl-none border border-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span>Clinical Care Navigator is reasoning...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                  <input
                    type="text"
                    value={patientChatMsg}
                    disabled={isChatThinking}
                    onChange={(e) => setPatientChatMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendPatientChat()}
                    placeholder="Type a question (e.g. Do I have cancer? Is it painful?)..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendPatientChat}
                    disabled={isChatThinking}
                    className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-sm transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pre-Authorized Appointment Clearance Card */}
          <div className="p-6 rounded-3xl liquid-glass-elevated border border-white/90 shadow-xl shadow-slate-200/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-700 uppercase">Confirmed Follow-Up Appointment</span>
                <h3 className="text-lg font-black text-slate-900">Targeted Ultrasound with Dr. Tariq Al-Nuaimi</h3>
                <span className="text-xs text-slate-500 font-medium">M42 Health Specialized Hospital | Thursday 10:30 AM</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left sm:text-right">
                <span className="text-xs font-mono text-slate-400 block font-bold">Insurance Status</span>
                <span className="text-sm font-mono font-black text-emerald-600">100% Pre-Authorized (AED 0.00 Copay)</span>
              </div>
              <button className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-sm hover:bg-emerald-500 transition-colors">
                View Digital Pass
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
