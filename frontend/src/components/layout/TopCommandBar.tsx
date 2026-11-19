"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useMarketPack } from "@/contexts/MarketPackContext";
import { useRole, ROLES, UserRole } from "@/contexts/RoleContext";
import { useTimeWarp } from "@/contexts/TimeWarpContext";
import { useDataMode } from "@/contexts/DataModeContext";
import {
  Activity,
  Shield,
  FileText,
  UserCheck,
  Share2,
  Lock,
  Sun,
  Moon,
  Clock,
  ChevronDown,
  Globe,
  RefreshCw,
  Zap,
} from "lucide-react";

export function TopCommandBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { activePackId, activePack, allPacks, setActivePackId } = useMarketPack();
  const { role, roleDetail, setRole } = useRole();
  const { timeOffsetHours, setTimeOffsetHours, warpLabel } = useTimeWarp();
  const { dataMode, toggleDataMode } = useDataMode();

  const [packDropdownOpen, setPackDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [warpDropdownOpen, setWarpDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setPackDropdownOpen(false);
      setRoleDropdownOpen(false);
      setWarpDropdownOpen(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const navTabs = [
    { href: "/command", label: "Command", icon: Activity },
    { href: "/intake", label: "Intake", icon: FileText },
    { href: "/workstation", label: "Workstation", icon: Shield },
    { href: "/referrals", label: "Referrals", icon: Share2 },
    { href: "/companion/LOOP-UAE-401", label: "Companion", icon: UserCheck },
    { href: "/ledger", label: "Ledger", icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-xl transition-colors duration-200 shadow-xs">
      <div className="max-w-[1880px] mx-auto px-4 sm:px-6 min-h-[70px] py-2 flex items-center justify-between gap-3">
        {/* Brand Anchor */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/command" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform border border-emerald-400/30">
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900">
                  CUSTODIA
                </span>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" title="System Live" />
              </div>
              <p className="text-[11px] text-slate-500 hidden 2xl:block font-semibold mt-0.5">
                Autonomous Clinical Custody &amp; Care Navigation Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Route Navigation Tabs */}
        <nav className="flex items-center gap-1 lg:gap-1.5 shrink-0 py-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              (tab.href === "/command" && pathname === "/") ||
              (tab.href === "/workstation" && pathname?.startsWith("/workstation")) ||
              (tab.href.startsWith("/companion") && pathname?.startsWith("/companion"));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Switchers */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Market Pack Selector Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPackDropdownOpen(!packDropdownOpen);
                setRoleDropdownOpen(false);
                setWarpDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 h-8.5 px-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <div className="flex items-center gap-1 text-left">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold hidden 2xl:inline">Pack:</span>
                <span className="truncate max-w-[100px] font-extrabold">{activePack?.name || "UAE DoH"}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {packDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
              >
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-3 py-1 font-bold">
                  Select Regulatory Jurisdiction
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {allPacks.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => {
                        setActivePackId(pack.id);
                        setPackDropdownOpen(false);
                      }}
                      className={`p-2.5 rounded-xl text-left text-xs font-semibold flex flex-col transition-all ${
                        activePackId === pack.id
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-sm">{pack.name}</span>
                      <span className="text-xs opacity-75">{pack.jurisdiction} ({pack.regulatory_framework})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRoleDropdownOpen(!roleDropdownOpen);
                setPackDropdownOpen(false);
                setWarpDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 h-8.5 px-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="flex items-center gap-1 text-left">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold hidden 2xl:inline">Role:</span>
                <span className="font-extrabold truncate max-w-[110px]">{roleDetail.title}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {roleDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
              >
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-3 py-1 font-bold">
                  Switch Clinical Persona
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {(Object.keys(ROLES) as UserRole[]).map((rKey) => {
                    const r = ROLES[rKey];
                    return (
                      <button
                        key={rKey}
                        onClick={() => {
                          setRole(rKey);
                          setRoleDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs transition-all ${
                          role === rKey
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-sm">
                          <span>{r.title}</span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/10">
                            {r.badge}
                          </span>
                        </div>
                        <p className="text-xs opacity-80 mt-0.5 leading-snug">{r.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Time-Warp SLA Clock Fast-Forward */}
          <div className="relative hidden md:block">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setWarpDropdownOpen(!warpDropdownOpen);
                setPackDropdownOpen(false);
                setRoleDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 h-8.5 px-2.5 rounded-xl text-xs font-bold border transition-colors shadow-xs ${
                timeOffsetHours > 0
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-800"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800"
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${timeOffsetHours > 0 ? "text-amber-600 animate-spin-slow" : "text-slate-400"}`} />
              <div className="flex items-center gap-1 text-left">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold hidden 2xl:inline">Warp:</span>
                <span className="font-extrabold">{warpLabel}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {warpDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
              >
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-3 py-1 font-bold">
                  SLA Fast-Forward Simulator
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {[
                    { h: 0, label: "Realtime (0h)" },
                    { h: 2, label: "+2h (Tier 1 Breach)" },
                    { h: 24, label: "+24h (1 Day)" },
                    { h: 48, label: "+48h (Tier 2 Breach)" },
                    { h: 168, label: "+168h (7 Days)" },
                    { h: 336, label: "+336h (14d Tier 3)" },
                  ].map((btn) => (
                    <button
                      key={btn.h}
                      onClick={() => {
                        setTimeOffsetHours(btn.h);
                        setWarpDropdownOpen(false);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
                        timeOffsetHours === btn.h
                          ? "bg-amber-600 text-white border-amber-500 shadow-sm"
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

          {/* Live SaaS / Demo Cohort Toggle */}
          <button
            onClick={toggleDataMode}
            className={`flex items-center gap-1.5 h-8.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer shadow-xs ${
              dataMode === "live"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30 glow-emerald"
                : "border-indigo-300 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900"
            }`}
            title={dataMode === "live" ? "Live SaaS Mode Active (0 mock data). Click to switch to Demo." : "Demo Cohort Active. Click to switch to Live SaaS."}
          >
            <Zap className={`w-3.5 h-3.5 ${dataMode === "live" ? "text-white animate-pulse" : "text-amber-500"}`} />
            <span className="hidden xl:inline">
              {dataMode === "live" ? "LIVE SAAS ACTIVE" : "SWITCH TO LIVE"}
            </span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
            title={`Switch to ${theme === "dark" ? "Clinical Alabaster" : "DICOM Dark"}`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
