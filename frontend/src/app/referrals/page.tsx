"use client";

import React, { useEffect, useState } from "react";
import {
  api,
  ScreeningLoop,
  MarketPack,
} from "@/lib/api";
import { useMarketPack } from "@/contexts/MarketPackContext";
import { useRole } from "@/contexts/RoleContext";
import {
  Network,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  RotateCcw,
  Sparkles,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Building,
} from "lucide-react";

export default function ReferralsPage() {
  const { activePack } = useMarketPack();
  const { currentRole } = useRole();

  const [loops, setLoops] = useState<ScreeningLoop[]>([]);
  const [selectedLoop, setSelectedLoop] = useState<ScreeningLoop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Available federated slots
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const fetchedLoops = await api.getLoops({ market_pack_id: activePack?.id });
        setLoops(fetchedLoops);

        // Pre-select a loop that is in referral or pending handshake
        const candidate =
          fetchedLoops.find((l) => l.handshake_status === "PENDING_ACCEPTANCE" || l.loop_code === "LOOP-NHS-406") ||
          fetchedLoops.find((l) => l.loop_code === "LOOP-UAE-401") ||
          fetchedLoops[0];
        if (candidate) setSelectedLoop(candidate);
      } catch (err) {
        console.error("Failed to load referrals:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activePack?.id]);

  // Two-Phase Handshake Accept
  const handleAcceptHandshake = async () => {
    if (!selectedLoop) return;
    setActionInProgress("accept");
    setActionNotice(null);
    try {
      const partner = activePack?.partner_facilities?.[1] || {
        id: "FAC-SPECIALIST-01",
        name: "Cleveland Clinic Abu Dhabi",
        city: "Abu Dhabi",
        specialties: ["Oncology", "Nephrology"],
      };

      await api.acceptHandshake(selectedLoop.id, {
        specialist_id: "SPEC-DR-AL-HASHIMI",
        specialist_name: "Dr. Mariam Al-Hashimi (Chief of Oncology)",
        specialist_facility: partner.name,
        slot_id: "SLOT-SPECIALIST-901",
        start_time_iso: new Date(Date.now() + 86400000 * 2).toISOString(),
        expected_version: selectedLoop.optimistic_version,
      });

      setActionNotice(`Referral Handshake accepted by ${partner.name}. Custody transferred to Stage 6.`);
      // Refresh
      const updated = await api.getLoop(selectedLoop.id);
      const loopData = updated?.loop || updated;
      if (loopData && loopData.id) {
        setSelectedLoop(loopData);
        // Update in local list
        setLoops((prev) => (prev || []).map((l) => (l && l.id === loopData.id ? loopData : l)));
      }
    } catch (err: any) {
      console.error("Accept failed:", err);
      setActionNotice(`Accept failed: ${err.message || err}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Two-Phase Handshake Reject and Auto-Reroute
  const handleRejectAndReroute = async () => {
    if (!selectedLoop) return;
    setActionInProgress("reject");
    setActionNotice(null);
    try {
      await api.rejectHandshake(selectedLoop.id, {
        specialist_id: "SPEC-DR-REJECT",
        rejection_reason: "Specialty Clinic Overcapacity: Triggering Autonomous Reroute.",
        expected_version: selectedLoop.optimistic_version,
      });

      setActionNotice(
        "Referral rejected by origin clinic. Custodia rules engine immediately triggered Auto-Reroute to alternate facility."
      );

      // Refresh
      const updated = await api.getLoop(selectedLoop.id);
      const loopData = updated?.loop || updated;
      if (loopData && loopData.id) {
        setSelectedLoop(loopData);
        setLoops((prev) => (prev || []).map((l) => (l && l.id === loopData.id ? loopData : l)));
      }
    } catch (err: any) {
      console.error("Reject failed:", err);
      setActionNotice(`Auto-reroute failed: ${err.message || err}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Book Federated Slot
  const handleBookSlot = async (slotId: string, facility: string, timeStr: string) => {
    if (!selectedLoop) return;
    setBookingInProgress(true);
    setSelectedSlot(slotId);
    try {
      await api.bookSlot(selectedLoop.id, {
        slot_id: slotId,
        facility_name: facility,
        start_iso: timeStr,
        specialist_name: "Attending Specialist",
      });
      setActionNotice(`Slot ${slotId} confirmed with Payer Pre-Authorization approval.`);
      const updated = await api.getLoop(selectedLoop.id);
      const loopData = updated?.loop || updated;
      if (loopData && loopData.id) {
        setSelectedLoop(loopData);
        setLoops((prev) => (prev || []).map((l) => (l && l.id === loopData.id ? loopData : l)));
      }
    } catch (err: any) {
      console.error("Slot booking failed:", err);
    } finally {
      setBookingInProgress(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-[1780px] mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-400/30">
            STAGE 05 &amp; 06: TWO-PHASE REFERRAL CLEARINGHOUSE
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Federated Slot Bridge &amp; Auto-Reroute
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
            Payer Pre-Authorization Real-Time
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Two-Phase Custody Handshake Clearinghouse
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
          Enforcing bi-directional clinical custody accountability: Specialist acceptance, automated rejection rerouting, and real-time payer pre-authorization.
        </p>
      </div>

      {/* Main Grid: Referral Triage Table & Handshake Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Outbound Referrals List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Network className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                  Referral Pipeline
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                {loops.length} Monitored Cases
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 max-h-[660px] overflow-y-auto">
              {loops.map((loop) => {
                const isSelected = selectedLoop?.id === loop.id;
                const isSpotlight = loop.loop_code === "LOOP-NHS-406" || loop.loop_code === "LOOP-UAE-401";
                return (
                  <button
                    key={loop.id}
                    onClick={() => {
                      setSelectedLoop(loop);
                      setActionNotice(null);
                    }}
                    className={`p-4 text-left transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-purple-500/15 dark:bg-purple-500/20 border-l-4 border-purple-500 rounded-r-2xl"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {loop.loop_code}
                        </span>
                        {isSpotlight && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-extrabold border border-cyan-400/30">
                            SPOTLIGHT
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-bold ${
                          loop.handshake_status === "ACCEPTED_TRANSFERRED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : loop.handshake_status === "PENDING_ACCEPTANCE"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : loop.handshake_status === "REJECTED_REROUTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {loop.handshake_status}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {loop.finding_category} &rarr; {loop.target_specialty}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold mt-1">
                      <span>Origin: {loop.custody_facility}</span>
                      <span>Stage: {loop.current_state}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Handshake Action & Payer Slot Bridge */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {selectedLoop && (
            <>
              {/* Two-Phase Handshake Action Card */}
              <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-purple-500 font-bold uppercase tracking-wider block mb-0.5">
                      Case Inspection
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                      {selectedLoop.loop_code}: {selectedLoop.finding_category}
                    </h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-mono text-slate-400 uppercase font-bold block">Acuity Tier</span>
                    <span className="font-mono text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                      {selectedLoop.acuity_tier} ({selectedLoop.sla_hours}h SLA)
                    </span>
                  </div>
                </div>

                {/* Facility Custody Flow Representation */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                  {/* Origin Primary Care */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">Referring Facility</span>
                    <strong className="text-base text-slate-900 dark:text-slate-100 font-extrabold">{selectedLoop.custody_facility}</strong>
                    <span className="text-xs text-slate-500 font-medium">Holder: {selectedLoop.custody_holder_name}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 self-center">
                    <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                  </div>

                  {/* Destination Specialist */}
                  <div className="flex flex-col gap-1 sm:text-right">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">Receiving Specialty</span>
                    <strong className="text-base text-purple-600 dark:text-purple-400 font-extrabold">
                      {selectedLoop.receiving_specialist_facility || "SEHA Specialty Center / M42"}
                    </strong>
                    <span className="text-xs text-slate-500 font-medium">{selectedLoop.target_specialty}</span>
                  </div>
                </div>

                {/* Interactive Handshake Actions */}
                <div className="flex flex-col gap-3 pt-1">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Two-Phase Handshake Clearinghouse Control:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleAcceptHandshake}
                      disabled={actionInProgress !== null || selectedLoop.handshake_status === "ACCEPTED_TRANSFERRED"}
                      className="flex items-center justify-center gap-2.5 p-4 rounded-2xl font-extrabold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        {actionInProgress === "accept"
                          ? "Executing Transfer..."
                          : selectedLoop.handshake_status === "ACCEPTED_TRANSFERRED"
                          ? "Handshake Accepted"
                          : "Accept Handshake & Transfer Custody"}
                      </span>
                    </button>

                    <button
                      onClick={handleRejectAndReroute}
                      disabled={actionInProgress !== null}
                      className="flex items-center justify-center gap-2.5 p-4 rounded-2xl font-extrabold text-sm sm:text-base bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>
                        {actionInProgress === "reject"
                          ? "Triggering Auto-Reroute..."
                          : "Reject Referral -> Auto-Reroute"}
                      </span>
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                    Testing Rejection activates deterministic rerouting to secondary facility defined in market pack.
                  </span>
                </div>

                {/* Action Feedback Notice */}
                {actionNotice && (
                  <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-800 dark:text-purple-200 text-xs sm:text-sm font-mono font-bold flex items-center gap-2.5 animate-in fade-in">
                    <Sparkles className="w-5 h-5 shrink-0 text-purple-400" />
                    <span>{actionNotice}</span>
                  </div>
                )}
              </div>

              {/* Federated Slot & Payer Pre-Auth Bridge */}
              <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                      Federated Slot &amp; Payer Pre-Auth Bridge
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                    Pre-Authorization: APPROVED
                  </span>
                </div>

                {/* Payer Clearance Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block mb-0.5">Payer Scheme</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-extrabold">Daman / Thiqa Enhanced</strong>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block mb-0.5">Auth Token</span>
                    <strong className="font-mono text-cyan-600 dark:text-cyan-400 font-extrabold">AUTH-DOH-2026-99214</strong>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block mb-0.5">Patient Copay</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">AED 0.00 (100% Cleared)</strong>
                  </div>
                </div>

                {/* Available Appointment Slots */}
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Pre-Authorized Booking Slots:
                  </span>
                  <div className="flex flex-col gap-3">
                    {[
                      {
                        id: "SLOT-01",
                        facility: "Cleveland Clinic Abu Dhabi",
                        specialist: "Dr. Fatima Al-Zahra (Breast Surgical Oncology)",
                        time: "Tomorrow, 09:30 AM",
                        slotsLeft: 2,
                      },
                      {
                        id: "SLOT-02",
                        facility: "Sheikh Shakhbout Medical City (SSMC)",
                        specialist: "Dr. Ahmed Mansoor (Consultant Oncologist)",
                        time: "Thursday, 11:15 AM",
                        slotsLeft: 4,
                      },
                      {
                        id: "SLOT-03",
                        facility: "M42 Health Specialized Hospital",
                        specialist: "Dr. Tariq Al-Nuaimi (Rapid Assessment Clinic)",
                        time: "Friday, 02:00 PM",
                        slotsLeft: 1,
                      },
                    ].map((slot) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                              {slot.facility} : {slot.specialist}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-500 font-mono font-semibold mt-0.5">
                              Time: {slot.time} ({slot.slotsLeft} slots remaining)
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookSlot(slot.id, slot.facility, slot.time)}
                          disabled={bookingInProgress}
                          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all shrink-0 disabled:opacity-60"
                        >
                          {selectedSlot === slot.id && bookingInProgress ? "Reserving..." : "Reserve Slot"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
