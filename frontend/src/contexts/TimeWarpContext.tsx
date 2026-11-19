"use client";

import React, { createContext, useContext, useState } from "react";

interface TimeWarpContextType {
  timeOffsetHours: number;
  timeWarpHours: number;
  setTimeOffsetHours: (hours: number) => void;
  setTimeWarpHours: (hours: number) => void;
  resetTimeWarp: () => void;
  warpLabel: string;
}

const TimeWarpContext = createContext<TimeWarpContextType>({
  timeOffsetHours: 0,
  timeWarpHours: 0,
  setTimeOffsetHours: () => {},
  setTimeWarpHours: () => {},
  resetTimeWarp: () => {},
  warpLabel: "Realtime",
});

export function TimeWarpProvider({ children }: { children: React.ReactNode }) {
  const [timeOffsetHours, setTimeOffsetHoursState] = useState<number>(0);

  const setTimeOffsetHours = (hours: number) => {
    setTimeOffsetHoursState(hours);
  };

  const setTimeWarpHours = (hours: number) => {
    setTimeOffsetHoursState(hours);
  };

  const resetTimeWarp = () => {
    setTimeOffsetHoursState(0);
  };

  const warpLabel =
    timeOffsetHours === 0
      ? "Realtime"
      : `+${timeOffsetHours}h (${(timeOffsetHours / 24).toFixed(1)}d fast-forward)`;

  return (
    <TimeWarpContext.Provider
      value={{
        timeOffsetHours,
        timeWarpHours: timeOffsetHours,
        setTimeOffsetHours,
        setTimeWarpHours,
        resetTimeWarp,
        warpLabel,
      }}
    >
      {children}
    </TimeWarpContext.Provider>
  );
}

export function useTimeWarp() {
  return useContext(TimeWarpContext);
}
