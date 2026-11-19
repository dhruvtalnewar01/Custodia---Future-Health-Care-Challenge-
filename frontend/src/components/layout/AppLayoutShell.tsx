"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarDashboard } from "@/components/layout/SidebarDashboard";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/" || pathname === "/login";

  if (isAuthPage) {
    return <main className="w-full min-h-screen overflow-x-hidden">{children}</main>;
  }

  return (
    <div className="relative flex min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      {/* Dynamic Animated Liquid Glass Ambient Meshes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Vitality Emerald Fluid Blob */}
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] rounded-full bg-gradient-to-br from-emerald-200/40 via-teal-300/25 to-transparent blur-[120px] mix-blend-multiply animate-blob-1 pointer-events-none" />

        {/* Top-Right Electric Indigo / Sapphire Fluid Blob */}
        <div className="absolute -top-[10%] -right-[12%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-bl from-indigo-200/35 via-blue-300/25 to-transparent blur-[130px] mix-blend-multiply animate-blob-2 pointer-events-none" />

        {/* Center-Bottom Royal Amethyst / Rose Fluid Blob */}
        <div className="absolute top-[45%] left-[25%] w-[45vw] h-[45vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tr from-purple-200/25 via-pink-200/20 to-transparent blur-[140px] mix-blend-multiply animate-blob-3 pointer-events-none" />

        {/* Bottom-Right Nordic Cyan / Seafoam Fluid Blob */}
        <div className="absolute -bottom-[15%] right-[5%] w-[48vw] h-[48vw] max-w-[750px] max-h-[750px] rounded-full bg-gradient-to-tl from-cyan-200/35 via-teal-200/20 to-transparent blur-[120px] mix-blend-multiply animate-blob-4 pointer-events-none" />

        {/* Liquid Frosted Crystalline Film */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px] pointer-events-none" />
      </div>

      {/* Main App Container */}
      <div className="relative z-10 flex min-h-screen w-full">
        <SidebarDashboard />
        <div className="flex-1 min-w-0 flex flex-col lg:pl-80 rtl:lg:pl-0 rtl:lg:pr-80 transition-all duration-300">
          <main className="flex-1 w-full max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
