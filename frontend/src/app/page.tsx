"use client";

import dynamic from "next/dynamic";

const TerraElixLandingHero = dynamic(
  () => import("@/components/landing/TerraElixLandingHero").then((mod) => mod.TerraElixLandingHero),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#07111a] flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    ),
  }
);

export default function RootPage() {
  return <TerraElixLandingHero />;
}
