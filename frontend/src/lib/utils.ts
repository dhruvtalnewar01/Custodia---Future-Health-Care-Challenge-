import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoStr?: string | null): string {
  if (!isoStr) return "N/A";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

export function formatTimeRemaining(deadlineIso: string, timeOffsetHours: number = 0): {
  hours: number;
  minutes: number;
  formatted: string;
  isBreached: boolean;
  urgencyLevel: "normal" | "warning" | "critical";
} {
  try {
    const deadline = new Date(deadlineIso).getTime();
    const now = Date.now() + timeOffsetHours * 3600 * 1000;
    const diffMs = deadline - now;

    if (diffMs <= 0) {
      const overHours = Math.abs(Math.floor(diffMs / (3600 * 1000)));
      return {
        hours: -overHours,
        minutes: 0,
        formatted: `BREACHED (+${overHours}h)`,
        isBreached: true,
        urgencyLevel: "critical",
      };
    }

    const totalHours = Math.floor(diffMs / (3600 * 1000));
    const totalMinutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

    const formatted = `${totalHours}h ${totalMinutes.toString().padStart(2, "0")}m`;
    let urgencyLevel: "normal" | "warning" | "critical" = "normal";

    if (totalHours < 4) {
      urgencyLevel = "critical";
    } else if (totalHours < 24) {
      urgencyLevel = "warning";
    }

    return {
      hours: totalHours,
      minutes: totalMinutes,
      formatted,
      isBreached: false,
      urgencyLevel,
    };
  } catch {
    return {
      hours: 0,
      minutes: 0,
      formatted: "N/A",
      isBreached: false,
      urgencyLevel: "normal",
    };
  }
}

export function shortenHash(hash?: string | null, left: number = 8, right: number = 8): string {
  if (!hash) return "00000000";
  if (hash.length <= left + right) return hash;
  return `${hash.slice(0, left)}...${hash.slice(-right)}`;
}

export function getAcuityColor(tier?: string | null): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
} {
  switch (tier) {
    case "TIER_1_CRITICAL":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-400",
        border: "border-rose-300 dark:border-rose-800",
        badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-300 dark:border-rose-700",
        dot: "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)] animate-pulse",
      };
    case "TIER_2_HIGH":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-300 dark:border-amber-800",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-700",
        dot: "bg-amber-500",
      };
    case "TIER_3_ROUTINE":
    default:
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-300 dark:border-blue-800",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-300 dark:border-blue-700",
        dot: "bg-blue-500",
      };
  }
}

export function getStateLabel(state?: string | null): {
  label: string;
  step: number;
  color: string;
} {
  switch (state) {
    case "1_RESULT_ISSUED":
      return { label: "01: Result Issued", step: 1, color: "text-slate-600 dark:text-slate-400" };
    case "2_PATIENT_NOTIFIED":
      return { label: "02: Patient Notified", step: 2, color: "text-blue-600 dark:text-blue-400" };
    case "3_COMPREHENSION_VERIFIED":
    case "3_TEACHBACK_COMPLETED":
      return { label: "03: Teach-Back Verified", step: 3, color: "text-cyan-600 dark:text-cyan-400" };
    case "4_PREREQ_VALIDATED":
      return { label: "04: Prereq Validated", step: 4, color: "text-amber-600 dark:text-amber-400" };
    case "5_REFERRAL_SUBMITTED":
    case "5_HANDSHAKE_PENDING":
      return { label: "05: Handshake Pending", step: 5, color: "text-purple-600 dark:text-purple-400" };
    case "6_HANDSHAKE_ACCEPTED":
    case "6_CUSTODY_TRANSFERRED":
      return { label: "06: Custody Transferred", step: 6, color: "text-indigo-600 dark:text-indigo-400" };
    case "7_CARE_DELIVERED":
    case "7_ENCOUNTER_CONFIRMED":
      return { label: "07: Care Delivered", step: 7, color: "text-emerald-600 dark:text-emerald-400" };
    case "8_VERIFIED_CLOSED":
      return { label: "08: Verified Closed", step: 8, color: "text-emerald-700 dark:text-emerald-300" };
    case "REJECTED_REROUTED":
      return { label: "Rerouted: Handshake Rejected", step: 5, color: "text-rose-600 dark:text-rose-400" };
    case "CANCELLED":
      return { label: "Cancelled: Artifact Rescinded", step: 0, color: "text-slate-500 dark:text-slate-500" };
    default:
      return { label: state || "Unknown", step: 0, color: "text-slate-600 dark:text-slate-400" };
  }
}
