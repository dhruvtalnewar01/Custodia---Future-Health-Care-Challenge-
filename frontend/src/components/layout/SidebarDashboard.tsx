"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Shield,
  Activity,
  FileText,
  Stethoscope,
  Share2,
  UserCheck,
  Lock,
  Globe,
  Clock,
  ChevronDown,
  Sparkles,
  Users,
  Compass,
  HeartPulse,
  Sliders,
  CheckCircle2,
  Menu,
  X,
  Languages,
  LogOut,
  ArrowRight,
  RefreshCw,
  Zap,
  Plus,
} from "lucide-react";
import { useMarketPack } from "@/contexts/MarketPackContext";
import { useRole, ROLES, UserRole } from "@/contexts/RoleContext";
import { useTimeWarp } from "@/contexts/TimeWarpContext";
import { useLanguage, LanguageCode } from "@/contexts/LanguageContext";
import { useDataMode } from "@/contexts/DataModeContext";

export function SidebarDashboard() {
  const pathname = usePathname();
  const { allPacks, activePack, activePackId, setActivePackId } = useMarketPack();
  const { role, setRole, roleDetail } = useRole();
  const { timeOffsetHours, setTimeOffsetHours, warpLabel } = useTimeWarp();
  const { language, setLanguage, direction, t, languages } = useLanguage();
  const { dataMode, setDataMode, setShowQuickIntakeModal } = useDataMode();

  const [packModalOpen, setPackModalOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [warpModalOpen, setWarpModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Role-Eligible Navigation Items: Only modules pertinent to the active category are viewable
  const eligibleNavItems = useMemo(() => {
    switch (role) {
      case "CMO":
        return [
          { href: "/command", label: t("command_center"), icon: Activity },
          { href: "/workstation", label: t("workstation"), icon: Stethoscope },
          { href: "/referrals", label: t("referrals"), icon: Share2 },
          { href: "/ledger", label: t("ledger"), icon: Lock },
        ];
      case "PCP":
        return [
          { href: "/command", label: "PCP Action Desk", icon: Activity },
          { href: "/intake", label: t("clinical_intake"), icon: FileText },
          { href: "/workstation", label: "Prerequisite Clearance", icon: Stethoscope },
        ];
      case "SPECIALIST":
        return [
          { href: "/command", label: "Specialist Care Desk", icon: Activity },
          { href: "/workstation", label: "Proof-of-Closure", icon: Stethoscope },
          { href: "/referrals", label: t("referrals"), icon: Share2 },
        ];
      case "NAVIGATOR":
        return [
          { href: "/command", label: "Hazard Interception", icon: Compass },
          { href: "/workstation", label: "Patient Triage", icon: Stethoscope },
          { href: "/companion/LOOP-UAE-401", label: "Guided Companion", icon: HeartPulse },
        ];
      case "PATIENT":
        return [
          { href: "/companion/LOOP-UAE-401", label: "My Care Journey", icon: HeartPulse },
        ];
      default:
        return [
          { href: "/command", label: t("command_center"), icon: Activity },
        ];
    }
  }, [role, t]);

  // Persona Theme Styling: Multicolor Themes
  const roleTheme = useMemo(() => {
    switch (role) {
      case "CMO":
        return {
          activeClass: "bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
          cardBorder: "border-emerald-200/90",
          cardBg: "from-emerald-50/80 to-teal-50/40",
          iconBg: "bg-emerald-600 text-white shadow-emerald-600/30",
          textAccent: "text-emerald-700",
        };
      case "PCP":
        return {
          activeClass: "bg-teal-600 text-white shadow-md shadow-teal-600/30",
          cardBorder: "border-teal-200/90",
          cardBg: "from-teal-50/80 to-cyan-50/40",
          iconBg: "bg-teal-600 text-white shadow-teal-600/30",
          textAccent: "text-teal-700",
        };
      case "SPECIALIST":
        return {
          activeClass: "bg-indigo-600 text-white shadow-md shadow-indigo-600/30",
          cardBorder: "border-indigo-200/90",
          cardBg: "from-indigo-50/80 to-blue-50/40",
          iconBg: "bg-indigo-600 text-white shadow-indigo-600/30",
          textAccent: "text-indigo-700",
        };
      case "NAVIGATOR":
        return {
          activeClass: "bg-purple-600 text-white shadow-md shadow-purple-600/30",
          cardBorder: "border-purple-200/90",
          cardBg: "from-purple-50/80 to-pink-50/40",
          iconBg: "bg-purple-600 text-white shadow-purple-600/30",
          textAccent: "text-purple-700",
        };
      case "PATIENT":
        return {
          activeClass: "bg-blue-600 text-white shadow-md shadow-blue-600/30",
          cardBorder: "border-blue-200/90",
          cardBg: "from-blue-50/80 to-cyan-50/40",
          iconBg: "bg-blue-600 text-white shadow-blue-600/30",
          textAccent: "text-blue-700",
        };
      default:
        return {
          activeClass: "bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
          cardBorder: "border-emerald-200/90",
          cardBg: "from-emerald-50/80 to-teal-50/40",
          iconBg: "bg-emerald-600 text-white shadow-emerald-600/30",
          textAccent: "text-emerald-700",
        };
    }
  }, [role]);

  return (
    <>
      {/* Mobile Menu Trigger Bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xs">
        <Link href="/command" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-sm shrink-0 border border-slate-800">
            <Image
              src="/assets/LOGO.gif"
              alt="CUSTODIA"
              width={32}
              height={32}
              className="w-full h-full object-cover mix-blend-screen scale-110"
              unoptimized
            />
          </div>
          <span className="font-black text-base tracking-tight text-slate-900">CUSTODIA</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Sidebar (Desktop fixed, Mobile sliding drawer) */}
      <aside
        className={`fixed top-0 bottom-0 z-40 w-72 lg:w-80 bg-white/95 backdrop-blur-2xl border-r border-slate-200/90 shadow-sm flex flex-col justify-between transition-transform duration-300 ease-in-out overflow-y-auto ${
          direction === "rtl" ? "right-0 border-l border-r-0" : "left-0"
        } ${
          mobileOpen ? "translate-x-0" : direction === "rtl" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Brand Anchor */}
        <div className="p-5 flex flex-col gap-5 border-b border-slate-100">
          <Link href="/command" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-slate-800/80 shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/assets/LOGO.gif"
                alt="CUSTODIA Care Platform"
                width={48}
                height={48}
                className="w-full h-full object-cover mix-blend-screen scale-110"
                unoptimized
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 pointer-events-none" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900">
                  {t("system_title")}
                </span>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" title="System Live" />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                {t("system_subtitle")}
              </p>
            </div>
          </Link>

          {/* Active Clinical Identity Card (Read-Only Status with Gateway Switch Action) */}
          <div className="relative">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
              <span>{t("active_role")}</span>
              <Link
                href="/login"
                className="text-emerald-700 hover:text-emerald-800 font-extrabold text-[10px] flex items-center gap-1 hover:underline"
                title="Open Persona Gateway"
              >
                <span>Switch Gateway</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div
              className={`w-full p-3 rounded-2xl border ${roleTheme.cardBorder} bg-gradient-to-r ${roleTheme.cardBg} flex items-center justify-between shadow-xs`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${roleTheme.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                  {role === "CMO" && <Activity className="w-5 h-5" />}
                  {role === "PCP" && <Stethoscope className="w-5 h-5" />}
                  {role === "SPECIALIST" && <UserCheck className="w-5 h-5" />}
                  {role === "NAVIGATOR" && <Compass className="w-5 h-5" />}
                  {role === "PATIENT" && <HeartPulse className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {roleDetail.title}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${roleTheme.textAccent}`}>
                    {roleDetail.badge}
                  </span>
                </div>
              </div>
              <Link
                href="/login"
                title="Switch Clinical Persona"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition-all shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Dual Switcher: Jurisdiction Pack & Multi-Language */}
          <div className="grid grid-cols-2 gap-2">
            {/* Market Pack Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setPackModalOpen(!packModalOpen);
                  setLangModalOpen(false);
                  setWarpModalOpen(false);
                }}
                className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-between gap-1 shadow-xs transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span className="truncate font-extrabold text-[11px]">{activePack?.name?.split(" ")[0] || "UAE"}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {packModalOpen && (
                <div className="absolute left-0 w-64 mt-2 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 font-bold">
                    {t("market_pack")}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {allPacks.map((pack) => (
                      <button
                        key={pack.id}
                        onClick={() => {
                          setActivePackId(pack.id);
                          setPackModalOpen(false);
                        }}
                        className={`p-2 rounded-xl text-left text-xs transition-all ${
                          activePackId === pack.id
                            ? "bg-emerald-600 text-white font-extrabold shadow-sm"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="font-bold">{pack.name}</div>
                        <div className="text-[10px] opacity-75">{pack.jurisdiction}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Global Language Selector (12 Languages USP) */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangModalOpen(!langModalOpen);
                  setPackModalOpen(false);
                  setWarpModalOpen(false);
                }}
                className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-between gap-1 shadow-xs transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Languages className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate font-extrabold text-[11px]">
                    {languages.find((l) => l.code === language)?.nativeName || "English"}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {langModalOpen && (
                <div className="absolute right-0 w-64 mt-2 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 font-bold">
                    {t("language")} (12 Native Dialects)
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1 max-h-56 overflow-y-auto">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setLangModalOpen(false);
                        }}
                        className={`p-2 rounded-xl text-left text-xs transition-all flex flex-col ${
                          language === l.code
                            ? "bg-purple-600 text-white font-black shadow-sm"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="font-bold">{l.nativeName}</span>
                        <span className="text-[10px] opacity-75">{l.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live SaaS Mode / Demo Cohort Switcher */}
          {dataMode === "demo" ? (
            <div className="p-2.5 rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 to-blue-50/40 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  DEMO COHORT ACTIVE
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-400">Pre-Input</span>
              </div>
              <button
                onClick={() => setDataMode("live")}
                className="w-full h-8 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer group"
                title="Switch to live production SaaS with 0 mock data"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Switch to Live SaaS Mode</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl border border-emerald-300/90 bg-gradient-to-br from-emerald-50/90 to-teal-50/40 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE SAAS MODE
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-700">0 Mock Data</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setShowQuickIntakeModal(true)}
                  className="h-7 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 shadow-2xs transition-all"
                  title="Create your own live clinical screening case"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Live Case</span>
                </button>
                <button
                  onClick={() => setDataMode("demo")}
                  className="h-7 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-mono font-bold flex items-center justify-center transition-all"
                  title="Switch back to demo cohort"
                >
                  <span>Demo Mode</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation Menu */}
        <div className="p-4 flex-1 flex flex-col gap-1.5">
          <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider px-3 py-1">
            Core Custody Modules
          </div>
          {eligibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/command" && pathname === "/") ||
              (item.href === "/workstation" && pathname?.startsWith("/workstation")) ||
              (item.href.startsWith("/companion") && pathname?.startsWith("/companion"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all group ${
                  isActive
                    ? `${roleTheme.activeClass} scale-[1.02]`
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-colors shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.3]" />
                </div>
                <span className="font-extrabold truncate flex-1">{item.label}</span>
              </Link>
            );
          })}

          {/* Persona View Specific Navigation Quick Link */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase font-extrabold text-slate-500">
              Active Persona Context:
            </span>
            <div className="text-xs font-black text-slate-900">
              {role === "CMO" && "Macro Population Oversight"}
              {role === "PCP" && "Intake Desk & STAT Labs"}
              {role === "SPECIALIST" && "Specialist Review & Closure"}
              {role === "NAVIGATOR" && "Drop-off Hazard Mitigation"}
              {role === "PATIENT" && "Patient Education & 3D Viewer"}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Dashboard views dynamically morph based on your selected persona.
            </p>
          </div>
        </div>

        {/* Bottom Section: SLA Time-Warp Simulation & Telemetry Status */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3 bg-slate-50/60">
          {/* Time Warp Fast Forward */}
          <div className="relative">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>{t("time_warp")}</span>
              <span className={`font-mono font-black ${timeOffsetHours > 0 ? "text-amber-600" : "text-slate-500"}`}>
                {warpLabel}
              </span>
            </div>
            <button
              onClick={() => {
                setWarpModalOpen(!warpModalOpen);
                setPackModalOpen(false);
                setLangModalOpen(false);
              }}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors shadow-xs ${
                timeOffsetHours > 0
                  ? "bg-amber-500/15 border-amber-400 text-amber-900"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className={`w-3.5 h-3.5 ${timeOffsetHours > 0 ? "text-amber-600 animate-spin-slow" : "text-slate-400"}`} />
                <span>Simulate Clock (+h)</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {warpModalOpen && (
              <div className="absolute bottom-12 left-0 right-0 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 font-bold">
                  SLA Fast-Forward Simulator
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {[
                    { h: 0, label: "Realtime (0h)" },
                    { h: 2, label: "+2h (T1 Breach)" },
                    { h: 24, label: "+24h (1 Day)" },
                    { h: 48, label: "+48h (T2 Breach)" },
                    { h: 168, label: "+168h (7d)" },
                    { h: 336, label: "+336h (14d T3)" },
                  ].map((btn) => (
                    <button
                      key={btn.h}
                      onClick={() => {
                        setTimeOffsetHours(btn.h);
                        setWarpModalOpen(false);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold text-center border transition-all ${
                        timeOffsetHours === btn.h
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Engine & Cryptographic Integrity Badges */}
          <div className="flex flex-col gap-1.5 pt-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Clinical Triage Network</span>
              </span>
              <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded">ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>RFC 8785 Ledger</span>
              </span>
              <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded">VALID ✓</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
