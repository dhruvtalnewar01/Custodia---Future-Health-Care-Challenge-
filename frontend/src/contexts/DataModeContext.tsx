"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ScreeningLoop } from "@/lib/api";

export type DataMode = "demo" | "live";

export interface CreateLiveCaseParams {
  patient_name: string;
  mrn: string;
  age?: number;
  sex?: "Female" | "Male";
  modality: string;
  finding_category: string;
  clinical_summary: string;
  acuity_tier: "TIER_1_CRITICAL" | "TIER_2_HIGH" | "TIER_3_ROUTINE";
  ordering_pcp: string;
  target_specialist?: string;
  sla_target_hours: number;
}

interface DataModeContextType {
  dataMode: DataMode;
  isLiveMode: boolean;
  setDataMode: (mode: DataMode) => void;
  toggleDataMode: () => void;
  liveLoops: ScreeningLoop[];
  createLiveLoop: (params: CreateLiveCaseParams) => ScreeningLoop;
  clearLiveLoops: () => void;
  showQuickIntakeModal: boolean;
  setShowQuickIntakeModal: (open: boolean) => void;
}

const DataModeContext = createContext<DataModeContextType | undefined>(undefined);

const STORAGE_KEY_MODE = "custodia_data_mode";
const STORAGE_KEY_LOOPS = "custodia_live_loops";

export function DataModeProvider({ children }: { children: React.ReactNode }) {
  const [dataMode, setDataModeState] = useState<DataMode>("demo");
  const [liveLoops, setLiveLoops] = useState<ScreeningLoop[]>([]);
  const [showQuickIntakeModal, setShowQuickIntakeModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as DataMode;
      if (savedMode === "live" || savedMode === "demo") {
        setDataModeState(savedMode);
      }
      try {
        const savedLoops = localStorage.getItem(STORAGE_KEY_LOOPS);
        if (savedLoops) {
          const parsed = JSON.parse(savedLoops);
          if (Array.isArray(parsed)) {
            setLiveLoops(parsed);
          }
        }
      } catch (e) {
        console.warn("Failed to load live loops from storage", e);
      }
    }
  }, []);

  const setDataMode = (mode: DataMode) => {
    setDataModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    }
  };

  const toggleDataMode = () => {
    const next = dataMode === "demo" ? "live" : "demo";
    setDataMode(next);
  };

  const createLiveLoop = (params: CreateLiveCaseParams): ScreeningLoop => {
    const loopId = `LOOP-LIVE-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const deadline = new Date(now.getTime() + params.sla_target_hours * 3600 * 1000);

    const newLoop: ScreeningLoop = {
      id: loopId,
      loop_code: loopId,
      patient_id: `pat-live-${Math.floor(100 + Math.random() * 900)}`,
      market_pack_id: "pack-uae-doh",
      trigger_resource_id: `FHIR-OBS-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
      accession_number: `ACC-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
      finding_category: params.finding_category,
      acuity_tier: params.acuity_tier,
      current_state: "1_SCREENING_DETECTED",
      optimistic_version: 1,
      custody_holder_id: "PCP-LIVE-01",
      custody_holder_name: params.ordering_pcp || "Dr. Sarah Jenkins, MD",
      custody_facility: "Active Outpatient Health Center",
      target_specialty: "Surgical Oncology",
      receiving_specialist_facility: "Specialty Care Center",
      handshake_status: "ORIGIN_HELD",
      sla_hours: params.sla_target_hours,
      sla_deadline_iso: deadline.toISOString(),
      sla_breached: false,
      comprehension_score: 0,
      dropoff_hazard_score: 0.15,
      dropoff_top_factors: ["DISTANCE_BARRIER"],
      prereq_validation_passed: true,
      missing_prereq_items: [],
      created_at_iso: now.toISOString(),
      updated_at_iso: now.toISOString(),
      patient: {
        id: `pat-live-${Math.floor(100 + Math.random() * 900)}`,
        mrn: params.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        full_name: params.patient_name || "Sophia Bennett",
        age: params.age || 42,
        sex: params.sex || "Female",
        preferred_language: "en",
        region_code: "LIVE-PROD",
        nationality_group: "Commercial Patient",
        payer_plan: "Direct Commercial / Verified Payer",
        distance_km: 8.5,
        prior_no_show_count: 0,
      },
    };

    const updated = [newLoop, ...liveLoops];
    setLiveLoops(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_LOOPS, JSON.stringify(updated));
    }
    return newLoop;
  };

  const clearLiveLoops = () => {
    setLiveLoops([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_LOOPS);
    }
  };

  return (
    <DataModeContext.Provider
      value={{
        dataMode,
        isLiveMode: dataMode === "live",
        setDataMode,
        toggleDataMode,
        liveLoops,
        createLiveLoop,
        clearLiveLoops,
        showQuickIntakeModal,
        setShowQuickIntakeModal,
      }}
    >
      {children}
    </DataModeContext.Provider>
  );
}

export function useDataMode() {
  const context = useContext(DataModeContext);
  if (!context) {
    throw new Error("useDataMode must be used within a DataModeProvider");
  }
  return context;
}
