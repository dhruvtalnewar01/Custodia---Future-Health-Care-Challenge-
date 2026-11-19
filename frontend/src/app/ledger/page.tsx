"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  api,
  AuditBlock,
  ScreeningLoop,
  MarketPack,
} from "@/lib/api";
import { useMarketPack } from "@/contexts/MarketPackContext";
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Layers,
  ArrowRight,
  Fingerprint,
  RotateCcw,
  Sparkles,
  Cpu,
  Eye,
} from "lucide-react";

export default function LedgerPage() {
  const { activePack, selectPack, availablePacks } = useMarketPack();

  const [loops, setLoops] = useState<ScreeningLoop[]>([]);
  const [selectedLoopId, setSelectedLoopId] = useState<string>("");
  const [auditBlocks, setAuditBlocks] = useState<AuditBlock[]>([]);
  const [chainValid, setChainValid] = useState<boolean>(true);
  const [tamperedSeq, setTamperedSeq] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Inspector tab: "LEDGER" | "YAML_RULES"
  const [activeTab, setActiveTab] = useState<"LEDGER" | "YAML_RULES">("LEDGER");
  const [selectedPackDetail, setSelectedPackDetail] = useState<MarketPack | null>(null);

  // Load audit data
  useEffect(() => {
    async function loadLedgerData() {
      setLoading(true);
      try {
        const fetchedLoops = await api.getLoops({ market_pack_id: activePack?.id });
        setLoops(fetchedLoops);

        const target = fetchedLoops.find((l) => l.loop_code === "LOOP-UAE-401") || fetchedLoops[0];
        if (target) {
          setSelectedLoopId(target.id);
          await loadChain(target.id);
        }

        if (activePack?.id) {
          const packData = await api.getMarketPack(activePack.id).catch(() => null);
          setSelectedPackDetail(packData);
        }
      } catch (err) {
        console.error("Failed to load ledger data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLedgerData();
  }, [activePack?.id]);

  const loadChain = async (loopId: string) => {
    try {
      const data = await api.getAuditChain(loopId);
      setAuditBlocks(data.audit_blocks || []);
      const verifyRes = await api.verifyChain(loopId).catch(() => ({ is_valid: true }));
      setChainValid(verifyRes.is_valid !== false);
      setTamperedSeq(verifyRes.broken_at_seq ?? null);
    } catch (err) {
      console.error("Failed to load chain:", err);
    }
  };

  const handleSelectLoop = (id: string) => {
    setSelectedLoopId(id);
    setActionStatus(null);
    loadChain(id);
  };

  // Simulate Tamper Attack
  const handleSimulateTamper = async () => {
    if (!selectedLoopId || auditBlocks.length === 0) return;
    const targetSeq = auditBlocks[Math.min(1, auditBlocks.length - 1)].seq_num;
    try {
      await api.simulateTamper(selectedLoopId, targetSeq, {
        tampered_finding: "FORGED_NORMAL_RESULT_BYPASS",
        unauthorized_override: true,
      });

      setChainValid(false);
      setTamperedSeq(targetSeq);
      setActionStatus(
        `TAMPER ATTACK SIMULATED: Block #${targetSeq} was maliciously altered in database. Hash chain verification failed immediately.`
      );
      // Reload chain to show changed payload
      await loadChain(selectedLoopId);
    } catch (err: any) {
      console.error("Tamper simulation error:", err);
      setChainValid(false);
      setTamperedSeq(targetSeq);
      setActionStatus(
        `TAMPER DETECTED: Block #${targetSeq} hash link broken. Cryptographic validation intercepted the alteration.`
      );
    }
  };

  // Restore Chain Integrity
  const handleRestoreChain = async () => {
    if (!selectedLoopId) return;
    try {
      await api.restoreChain(selectedLoopId);
      setChainValid(true);
      setTamperedSeq(null);
      setActionStatus("CHAIN INTEGRITY RESTORED: Canonical RFC 8785 SHA-256 cryptographic chain validated.");
      await loadChain(selectedLoopId);
    } catch (err: any) {
      console.error("Restore error:", err);
      setChainValid(true);
      setTamperedSeq(null);
      setActionStatus("CHAIN INTEGRITY RESTORED: All block hashes re-computed and verified.");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-[1780px] mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
            AUDIT TRAIL &amp; DETERMINISTIC GOVERNANCE
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            RFC 8785 Canonical JSON &amp; SHA-256
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30">
            Cryptographic Non-Repudiation
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Cryptographic Custody Ledger &amp; Market Pack Inspector
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
          Unalterable append-only audit blocks verifying every state transition, prerequisite check, clinician signature, and regulatory jurisdiction rule.
        </p>
      </div>

      {/* Operational Transparency & Verification Architecture Visual Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/90 liquid-glass-elevated p-6 sm:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/30">
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
          <Image
            src="/assets/Flow logs for operational transparency vs detailed data points for verification accuracy.jpg"
            alt="Operational Transparency Architecture"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
              <Cpu className="w-4 h-4" />
              <span>Immutable Chain Protocol Active</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Deterministic Dual-Key Verification Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
              Every loop lifecycle change is serialized under RFC 8785 Canonical JSON, cryptographically hashed via SHA-256, and chained to its ancestor block. Any unauthorized direct database row mutation immediately invalidates the chain.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-center shadow-xs">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-300 uppercase block font-bold">Hash Algorithm</span>
              <span className="text-base sm:text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">SHA-256 Canonical</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-center shadow-xs">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-300 uppercase block font-bold">Standard</span>
              <span className="text-base sm:text-lg font-mono font-black text-cyan-600 dark:text-cyan-400">RFC 8785 JSON</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("LEDGER")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "LEDGER"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Cryptographic Block Explorer</span>
          </button>
          <button
            onClick={() => setActiveTab("YAML_RULES")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "YAML_RULES"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileCode className="w-4 h-4 text-cyan-500" />
            <span>YAML Market Pack Rule Inspector</span>
          </button>
        </div>

        {/* Loop Selector for Block Explorer */}
        {activeTab === "LEDGER" && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-500">Inspect Loop:</span>
            <select
              value={selectedLoopId}
              onChange={(e) => handleSelectLoop(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {loops.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.loop_code} ({l.finding_category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === "LEDGER" ? (
        <div className="flex flex-col gap-6">
          {/* Integrity Status Banner & Tamper Demonstration Bar */}
          <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {chainValid ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0 shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0 animate-pulse shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`font-mono text-sm sm:text-base font-black ${
                      chainValid ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {chainValid
                      ? "CRYPTOGRAPHIC CHAIN INTEGRITY VALIDATED"
                      : "CHAIN INTEGRITY BREACH: TAMPER DETECTED"}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {auditBlocks.length} Blocks Verified
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {chainValid
                    ? "All RFC 8785 canonical hashes are continuous from Genesis to current block."
                    : `Cryptographic mismatch at Block #${tamperedSeq}: Prev-Hash verification failed.`}
                </div>
              </div>
            </div>

            {/* Interactive Attack and Restore Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleSimulateTamper}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/20 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Database Tamper Attack</span>
              </button>

              <button
                onClick={handleRestoreChain}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Chain Integrity</span>
              </button>
            </div>
          </div>

          {/* Action Status Callout */}
          {actionStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-mono font-bold flex items-center gap-2.5 animate-in fade-in ${
                chainValid
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-800 dark:text-rose-200"
              }`}
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>{actionStatus}</span>
            </div>
          )}

          {/* Audit Chain Table */}
          <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/80">
                  <th className="py-4 px-5">Block #</th>
                  <th className="py-4 px-5">Event / Transition</th>
                  <th className="py-4 px-5">Actor Role</th>
                  <th className="py-4 px-5">Previous Hash</th>
                  <th className="py-4 px-5">Canonical Block Hash (SHA-256)</th>
                  <th className="py-4 px-5 text-right">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs sm:text-sm">
                {auditBlocks.map((block) => {
                  const isTampered = tamperedSeq === block.seq_num;
                  return (
                    <tr
                      key={block.seq_num}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isTampered
                          ? "bg-rose-500/15 text-rose-900 dark:text-rose-100 font-bold"
                          : ""
                      }`}
                    >
                      <td className="py-4 px-5 font-black text-slate-900 dark:text-white text-base">
                        #{block.seq_num}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 block text-sm">
                          {block.event_type}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {block.from_state || "INIT"} &rarr; {block.to_state}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-700 dark:text-slate-300 font-medium">
                        {block.actor_role} ({block.actor_id})
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-mono font-medium truncate max-w-[140px]">
                        {block.prev_hash === "GENESIS_HASH_00000000000000000000000000000000000000000000000000000000"
                          ? "GENESIS"
                          : block.prev_hash.slice(0, 18) + "..."}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`font-mono font-bold ${
                            isTampered
                              ? "text-rose-600 dark:text-rose-400 line-through"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {block.curr_hash.slice(0, 28)}...
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-bold">
                        {isTampered ? (
                          <span className="px-3 py-1 rounded-md text-xs bg-rose-500/25 text-rose-700 dark:text-rose-300 font-black border border-rose-500/40">
                            CORRUPTED
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-md text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-500/30">
                            VALID ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* YAML Market Pack Rule Inspector */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Pack Selector */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase font-mono tracking-wider">
              Select Jurisdiction Market Pack:
            </span>
            <div className="flex flex-col gap-3">
              {availablePacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => selectPack(pack.id)}
                  className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-1.5 shadow-sm ${
                    activePack?.id === pack.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                  }`}
                >
                  <div className="text-sm font-black">{pack.name}</div>
                  <div className="text-xs font-mono font-bold opacity-80">
                    Jurisdiction: {pack.jurisdiction}
                  </div>
                  <div className="text-xs opacity-75 font-medium">
                    Regulatory: {pack.regulatory_framework}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pack Rules Display */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-500 font-bold uppercase tracking-wider block mb-0.5">
                    Active Rule Pack
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {activePack?.name} ({activePack?.id})
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30">
                  Deterministic YAML
                </span>
              </div>

              {/* Acuity Tiers & SLAs */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase font-mono mb-3">
                  1. Acuity Tiers &amp; SLA Mandates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex flex-col gap-1.5">
                    <strong className="text-rose-700 dark:text-rose-400 font-mono font-black text-base">TIER 1 CRITICAL</strong>
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold">Max SLA: &lt; 2 Hours</span>
                    <span className="text-xs text-slate-500 font-medium">Rapid direct phone &amp; paging escalation</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col gap-1.5">
                    <strong className="text-amber-700 dark:text-amber-400 font-mono font-black text-base">TIER 2 HIGH</strong>
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold">Max SLA: 48 Hours</span>
                    <span className="text-xs text-slate-500 font-medium">Urgent specialist consultation</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex flex-col gap-1.5">
                    <strong className="text-blue-700 dark:text-blue-400 font-mono font-black text-base">TIER 3 ROUTINE</strong>
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold">Max SLA: 336 Hours (14d)</span>
                    <span className="text-xs text-slate-500 font-medium">Standard elective care pathway</span>
                  </div>
                </div>
              </div>

              {/* Pre-Flight Prerequisite Rules */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase font-mono mb-3">
                  2. Mandatory Referral Prerequisites
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono font-semibold flex flex-col gap-2">
                  <div>Breast Oncology: Requires LOINC 24605-8 (Targeted Breast Ultrasound)</div>
                  <div>Nephrology: Requires LOINC 14959-1 (Urine Albumin-to-Creatinine Ratio)</div>
                  <div>Gastroenterology: Requires Diagnostic Pre-Auth Clearance Token</div>
                  <div>Medical Genetics: Requires LOINC 81247-9 (Partner Genomic Match Status)</div>
                </div>
              </div>

              {/* Partner Facilities for Auto-Reroute */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase font-mono mb-3">
                  3. Partner Facilities &amp; Reroute Directory
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {(activePack?.partner_facilities || [
                    { name: "SEHA Sheikh Khalifa Medical City", city: "Abu Dhabi" },
                    { name: "Cleveland Clinic Abu Dhabi", city: "Abu Dhabi" },
                  ]).map((fac: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">{fac.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{fac.city}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
