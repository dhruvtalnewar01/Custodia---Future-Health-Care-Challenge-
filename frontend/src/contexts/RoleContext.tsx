"use client";

import React, { createContext, useContext, useState } from "react";

export type UserRole = "CMO" | "PCP" | "SPECIALIST" | "NAVIGATOR" | "PATIENT";

export interface RoleDetail {
  id: UserRole;
  title: string;
  badge: string;
  description: string;
  clinicianId: string;
  clinicianName: string;
  facility: string;
}

export const ROLES: Record<UserRole, RoleDetail> = {
  CMO: {
    id: "CMO",
    title: "Chief Medical Officer",
    badge: "System Executive",
    description: "Macro population health oversight, SLA breach interception, and k-anonymity equity audits.",
    clinicianId: "EXEC-CMO-01",
    clinicianName: "Dr. Farida Al-Hosani, MD (CMO)",
    facility: "Health System Command Clearinghouse",
  },
  PCP: {
    id: "PCP",
    title: "Primary Care Attending",
    badge: "Origin Clinician",
    description: "Intake abnormal screening flags, review clinical diagnostic extractions, and order pre-flight prerequisite tests.",
    clinicianId: "DR-UAE-201",
    clinicianName: "Dr. Maryam Al-Nuaimi, MD",
    facility: "Cleveland Clinic Abu Dhabi (Primary Care)",
  },
  SPECIALIST: {
    id: "SPECIALIST",
    title: "Receiving Specialist",
    badge: "Custody Receiver",
    description: "Evaluate 90-second e-consult cards, sign two-phase handshakes, and execute cryptographic Proof-of-Closure.",
    clinicianId: "DR-SPEC-801",
    clinicianName: "Dr. Jonathan Hayes, FRCS",
    facility: "M42 Center of Excellence / Cleveland Clinic",
  },
  NAVIGATOR: {
    id: "NAVIGATOR",
    title: "Nurse Navigator",
    badge: "Retention Coordinator",
    description: "Monitor survival drop-off hazards, clear transport barriers, and support patient teach-back.",
    clinicianId: "NAV-NURSE-04",
    clinicianName: "Amina Al-Falasi, RN (Navigator)",
    facility: "Comprehensive Patient Navigation Center",
  },
  PATIENT: {
    id: "PATIENT",
    title: "Patient / Partner",
    badge: "Patient Portal",
    description: "Explore 3D anatomical explainers, complete multilingual voice/chat teach-back, and book pre-authorized appointments.",
    clinicianId: "PAT-SELF",
    clinicianName: "Sophia Bennett",
    facility: "Custodia Patient Companion",
  },
};

interface RoleContextType {
  role: UserRole;
  currentRole: UserRole;
  roleDetail: RoleDetail;
  currentRoleDetail: RoleDetail;
  setRole: (r: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: "CMO",
  currentRole: "CMO",
  roleDetail: ROLES.CMO,
  currentRoleDetail: ROLES.CMO,
  setRole: () => { },
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("CMO");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("custodia-role") as UserRole | null;
      if (saved && ROLES[saved]) {
        setRoleState(saved);
      }
    }
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    if (typeof window !== "undefined") {
      localStorage.setItem("custodia-role", r);
      window.dispatchEvent(new CustomEvent("custodia-role-changed", { detail: r }));
    }
  };

  const roleDetail = ROLES[role];

  return (
    <RoleContext.Provider
      value={{
        role,
        currentRole: role,
        roleDetail,
        currentRoleDetail: roleDetail,
        setRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
