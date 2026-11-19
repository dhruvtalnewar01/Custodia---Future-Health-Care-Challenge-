import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MarketPackProvider } from "@/contexts/MarketPackContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { TimeWarpProvider } from "@/contexts/TimeWarpContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DataModeProvider } from "@/contexts/DataModeContext";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";

export const metadata: Metadata = {
  title: "CUSTODIA : Autonomous Clinical Custody & Loop-Closure Platform",
  description:
    "Self-Enforcing Screening-to-Care Custody Platform powered by HL7 FHIR R4, deterministic YAML Market Packs, RFC 8785 SHA-256 hash chains, and Dual-Key Proof-of-Closure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Antonio:wght@400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400;1,9..40,500&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-emerald-500/20 selection:text-emerald-700">
        <LanguageProvider>
          <DataModeProvider>
            <ThemeProvider>
              <MarketPackProvider>
                <RoleProvider>
                  <TimeWarpProvider>
                    <AppLayoutShell>{children}</AppLayoutShell>
                  </TimeWarpProvider>
                </RoleProvider>
              </MarketPackProvider>
            </ThemeProvider>
          </DataModeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
