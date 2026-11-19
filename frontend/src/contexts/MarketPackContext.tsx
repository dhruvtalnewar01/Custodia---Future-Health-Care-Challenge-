"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, MarketPack } from "@/lib/api";

interface MarketPackContextType {
  activePackId: string;
  activePack: MarketPack | null;
  allPacks: MarketPack[];
  availablePacks: MarketPack[];
  setActivePackId: (id: string) => void;
  selectPack: (id: string) => void;
  isLoading: boolean;
}

const DEFAULT_PACK_ID = "pack-uae-doh";

const MarketPackContext = createContext<MarketPackContextType>({
  activePackId: DEFAULT_PACK_ID,
  activePack: null,
  allPacks: [],
  availablePacks: [],
  setActivePackId: () => { },
  selectPack: () => {},
  isLoading: false,
});

export function MarketPackProvider({ children }: { children: React.ReactNode }) {
  const [activePackId, setActivePackIdState] = useState<string>(DEFAULT_PACK_ID);
  const [allPacks, setAllPacks] = useState<MarketPack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPacks() {
      try {
        setIsLoading(true);
        const packs = await api.getMarketPacks();
        setAllPacks(packs);
        const saved = localStorage.getItem("custodia-market-pack");
        if (saved && packs.some((p) => p.id === saved)) {
          setActivePackIdState(saved);
        }
      } catch (err) {
        console.error("Failed to load market packs from backend:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPacks();
  }, []);

  const setActivePackId = (id: string) => {
    setActivePackIdState(id);
    localStorage.setItem("custodia-market-pack", id);
  };

  const activePack = allPacks.find((p) => p.id === activePackId) || allPacks[0] || null;

  return (
    <MarketPackContext.Provider
      value={{
        activePackId,
        activePack,
        allPacks,
        availablePacks: allPacks,
        setActivePackId,
        selectPack: setActivePackId,
        isLoading,
      }}
    >
      {children}
    </MarketPackContext.Provider>
  );
}

export function useMarketPack() {
  return useContext(MarketPackContext);
}
