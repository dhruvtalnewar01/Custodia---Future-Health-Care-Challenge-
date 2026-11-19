"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowUpRight,
  Lock,
  GitBranch,
  Activity,
  Menu,
  X,
} from "lucide-react";

export function TerraElixLandingHero() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Auto-rotating card carousel: 4 cards cycling every 3500ms
  const carouselCards = [
    {
      icon: ShieldCheck,
      circleBg: "bg-black",
      text: "8-Stage deterministic state machine enforcing strict clinical custody transfer.",
    },
    {
      icon: Lock,
      circleBg: "bg-emerald-800",
      text: "Dual-key cryptographic proof-of-closure verified via WebCrypto ECDSA P-256.",
    },
    {
      icon: GitBranch,
      circleBg: "bg-cyan-800",
      text: "Two-phase specialist handshake eliminating outpatient referral black holes.",
    },
    {
      icon: Activity,
      circleBg: "bg-amber-700",
      text: "Pre-authorized diagnostic booking and patient teach-back comprehension validation.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % carouselCards.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [carouselCards.length]);

  const handleNavigateToLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    router.push("/login");
  };

  return (
    <div
      className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col justify-between relative bg-cover bg-center bg-no-repeat selection:bg-emerald-500/30 selection:text-white"
      style={{
        backgroundImage: "url('/assets/bg.webp')",
      }}
    >
      {/* 1. Ultra-Clean Top Bar: Logo on left, one/two sleek elements on right */}
      <nav className="w-full px-6 sm:px-10 lg:px-16 py-4 lg:py-5 flex items-center justify-between relative z-20 animate-fade-in shrink-0">
        {/* Left: Brand Name & Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer group animate-slide-left delay-200"
          aria-label="CUSTODIA Care Platform"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black/60 flex items-center justify-center border border-white/20 shadow-md">
            <Image
              src="/assets/LOGO.gif"
              alt="CUSTODIA"
              width={32}
              height={32}
              className="w-full h-full object-cover mix-blend-screen scale-110"
              unoptimized
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['DM_Sans'] font-medium text-[22px] sm:text-[24px] text-white tracking-[-0.04em] leading-none drop-shadow-sm">
              CUSTODIA
            </span>
          </div>
        </Link>

        {/* Right: Only 2 Sleek Elements (Live Status Pill + Enter Terminal Button) */}
        <div className="flex items-center gap-3 sm:gap-4 animate-slide-right delay-300">
          {/* Live System Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/15 backdrop-blur-md text-xs font-mono text-white/90 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-tight">8-Stage Custody Engine</span>
          </div>

          {/* Minimal Pill CTA */}
          <button
            onClick={handleNavigateToLogin}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white text-black font-['Inter'] font-medium text-xs sm:text-sm tracking-tight hover:bg-white/90 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg flex items-center gap-1.5 group"
          >
            <span>Enter Terminal</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden w-8 h-8 flex items-center justify-center text-white cursor-pointer ml-1"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-30 flex flex-col items-center justify-center gap-8 animate-fade-in p-6">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-6 text-white p-2"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center gap-5 font-['DM_Sans'] font-medium text-xl text-white text-center">
            <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest">
              Autonomous Clinical Custody Platform
            </span>
            <p className="text-white/80 text-sm max-w-xs leading-relaxed">
              Deterministic screening-to-care loop closure terminating patient drop-off with dual-key cryptographic proof.
            </p>
          </div>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleNavigateToLogin();
            }}
            className="mt-4 px-8 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors shadow-lg"
          >
            Enter Clinical Gateway
          </button>
        </div>
      )}

      {/* 2. Hero Content Section: Perfectly Balanced Typography & Spacing */}
      <section className="flex-1 flex flex-col justify-center relative z-10 px-6 sm:px-10 lg:px-16 py-4 lg:py-2">
        {/* Authoritative, Impactful 2-Line Headline */}
        <h1 className="font-['DM_Sans'] font-normal tracking-[-0.04em] text-left select-none text-[32px] leading-[36px] sm:text-[46px] sm:leading-[50px] md:text-[56px] md:leading-[60px] lg:text-[66px] lg:leading-[70px] xl:text-[76px] xl:leading-[80px] max-w-4xl">
          {/* Line 1: Autonomous Clinical Custody. */}
          <div className="block">
            <div className="overflow-hidden inline-block mr-2 sm:mr-3 lg:mr-4">
              <span
                className="inline-block text-white animate-word-reveal"
                style={{ animationDelay: "0.2s" }}
              >
                Autonomous
              </span>
            </div>
            <div className="overflow-hidden inline-block mr-2 sm:mr-3 lg:mr-4">
              <span
                className="inline-block text-white animate-word-reveal"
                style={{ animationDelay: "0.3s" }}
              >
                Clinical
              </span>
            </div>
            <div className="overflow-hidden inline-block">
              <span
                className="inline-block text-white animate-word-reveal"
                style={{ animationDelay: "0.4s" }}
              >
                Custody.
              </span>
            </div>
          </div>

          {/* Line 2: Zero Patients Lost to Follow-Up. */}
          <div className="block mt-1 sm:mt-2">
            <div className="overflow-hidden inline-block mr-2 sm:mr-3 lg:mr-4">
              <span
                className="inline-block text-white animate-word-reveal"
                style={{ animationDelay: "0.5s" }}
              >
                Zero
              </span>
            </div>
            <div className="overflow-hidden inline-block mr-2 sm:mr-3 lg:mr-4">
              <span
                className="inline-block text-white animate-word-reveal"
                style={{ animationDelay: "0.6s" }}
              >
                Patients
              </span>
            </div>
            <div className="overflow-hidden inline-block mr-2 sm:mr-3 lg:mr-4">
              <span
                className="inline-block text-white/55 animate-word-reveal"
                style={{ animationDelay: "0.7s" }}
              >
                Lost
              </span>
            </div>
            <div className="overflow-hidden inline-block mr-2 sm:mr-3 lg:mr-4">
              <span
                className="inline-block text-white/55 animate-word-reveal"
                style={{ animationDelay: "0.8s" }}
              >
                to
              </span>
            </div>
            <div className="overflow-hidden inline-block align-middle">
              <span
                className="inline-block text-white/55 animate-word-reveal"
                style={{ animationDelay: "0.9s" }}
              >
                Follow-Up
              </span>
            </div>

            {/* Inline Verified Closure Seal Badge */}
            <div className="hidden sm:inline-block align-middle ml-2 sm:ml-3 lg:ml-4 overflow-hidden">
              <img
                src="/assets/inline.png"
                alt="Verified Closure Seal"
                className="inline-block align-middle animate-scale-in delay-1000 object-contain drop-shadow-md"
                style={{
                  height: "clamp(34px, 4.5vw, 62px)",
                  width: "auto",
                }}
              />
            </div>
          </div>
        </h1>

        {/* CTA Section: Scaled for Restrained Enterprise Luxury */}
        <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 animate-fade-up delay-600">
          <button
            onClick={handleNavigateToLogin}
            className="h-11 sm:h-12 px-7 rounded-full bg-black text-white hover:bg-black/85 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xl flex items-center justify-center font-['Inter'] font-medium text-sm sm:text-base tracking-tight group"
          >
            <span>Enter Clinical Gateway</span>
            <ArrowUpRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <p className="text-white/85 max-w-md font-['Inter'] font-normal text-xs sm:text-sm leading-relaxed tracking-normal">
            Deterministic screening-to-care custody platform terminating patient drop-off across oncology and metabolic pathways with dual-key cryptographic proof.
          </p>
        </div>
      </section>

      {/* 3. Mobile/Tablet Visual Asset (visible below lg) */}
      <div className="lg:hidden relative z-0 w-full overflow-hidden flex justify-center pointer-events-none select-none my-3 px-4">
        <img
          src="/assets/custodia_hero_asset_pristine.png"
          alt="CUSTODIA Clinical Custody Platform"
          className="w-[85%] sm:w-[65%] max-w-[380px] object-contain mx-auto drop-shadow-2xl animate-scale-in delay-700"
        />
      </div>

      {/* 4. Bottom 3-Panel Grid: Compact, Polished, Zero-Overlap */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] w-full border-t border-white/20 shrink-0">
        {/* Panel 1 (bg-[#ECEDEC]) */}
        <div className="bg-[#ECEDEC]/95 backdrop-blur-md p-4 sm:p-5 lg:p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[150px] lg:min-h-[160px] animate-fade-up delay-900 border-b md:border-b-0 md:border-r border-black/10">
          <div>
            <h2 className="font-['DM_Sans'] font-normal text-base sm:text-lg lg:text-[20px] leading-[1.2] tracking-tight max-w-[280px] text-slate-900">
              Deterministic state machine for zero patient drop-off
            </h2>
          </div>
          <div className="mt-3 z-10">
            <button
              onClick={handleNavigateToLogin}
              className="font-['Inter'] font-medium text-xs sm:text-sm tracking-tight underline text-slate-800 hover:text-black transition-opacity cursor-pointer inline-flex items-center gap-1"
            >
              Launch Clinical Gateway
            </button>
          </div>
          {/* Decorative clinical DNA molecular graphic on right */}
          <img
            src="/assets/panel1_clinical.png"
            alt="Clinical Molecular Topology"
            className="absolute right-0 bottom-0 h-full w-auto max-w-[44%] object-contain pointer-events-none select-none opacity-85"
          />
        </div>

        {/* Panel 2 (bg-[#FEFDF9]) - Auto-rotating Card Carousel (Zero Text Overlap) */}
        <div className="bg-[#FEFDF9]/95 backdrop-blur-md p-4 sm:p-5 lg:p-6 relative flex flex-col justify-between min-h-[140px] sm:min-h-[150px] lg:min-h-[160px] animate-fade-up delay-1000 overflow-hidden border-b md:border-b-0 md:border-r border-black/10">
          {/* Active Carousel Card Content */}
          <div className="relative h-16 sm:h-20 w-full flex items-center">
            {(() => {
              const currentCard = carouselCards[activeCardIndex];
              const IconComponent = currentCard.icon;
              return (
                <div
                  key={activeCardIndex}
                  className="flex items-start gap-3 animate-fade-in w-full"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${currentCard.circleBg}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <p className="font-['Inter'] font-normal text-xs sm:text-sm text-slate-800 leading-snug tracking-tight line-clamp-2">
                    {currentCard.text}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Bottom Indicators: 4 Thin Bars */}
          <div className="flex gap-1.5 mt-2 w-full">
            {carouselCards.map((_, idx) => (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                  idx === activeCardIndex ? "bg-black" : "bg-black/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Panel 3 (bg-black) */}
        <div className="bg-black/95 backdrop-blur-md p-4 sm:p-5 lg:p-6 flex items-center justify-between gap-4 min-h-[140px] sm:min-h-[150px] lg:min-h-[160px] animate-fade-up delay-1100 text-white">
          {/* Left: Clinician & Digital Twin Image */}
          <div className="w-[76px] h-[52px] sm:w-[94px] sm:h-[64px] lg:w-[104px] lg:h-[70px] rounded-lg overflow-hidden shadow-lg shrink-0 bg-slate-900 border border-white/10">
            <img
              src="/assets/panel3_clinical.jpg"
              alt="Clinical Care Team & Patients"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right: +82K Metric & Headline */}
          <div className="flex flex-col justify-center">
            <span className="font-['Inter'] font-normal text-xl sm:text-2xl lg:text-[26px] tracking-tight text-white leading-none">
              +82K
            </span>
            <span className="text-white/65 font-['Inter'] font-normal text-[11px] sm:text-xs leading-snug mt-1">
              Active care loops closed with zero human drop-off
            </span>
          </div>
        </div>
      </div>

      {/* 5. Desktop Floating Product Visual Asset (lg+ only): Perfectly Sized & Positioned */}
      <img
        src="/assets/custodia_hero_asset_pristine.png"
        alt="CUSTODIA Clinical Custody Platform"
        className="absolute z-0 hidden lg:block pointer-events-none drop-shadow-2xl animate-scale-in delay-700 select-none"
        style={{
          width: "clamp(340px, 34vw, 520px)",
          height: "auto",
          bottom: "16%",
          right: "clamp(20px, 4vw, 80px)",
        }}
      />
    </div>
  );
}
