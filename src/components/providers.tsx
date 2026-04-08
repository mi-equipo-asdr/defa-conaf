"use client";

import { useState, useCallback, type ReactNode } from "react";
import { AppContext } from "@/lib/store";
import type { BalanceReport, HistoryEntry } from "@/lib/types";
import { DEMO_REPORT, DEMO_HISTORY } from "@/lib/demo-data";

export function Providers({ children }: { children: ReactNode }) {
  const [report, setReportState] = useState<BalanceReport | null>(DEMO_REPORT);
  const [history, setHistory] = useState<HistoryEntry[]>(DEMO_HISTORY);

  const setReport = useCallback((r: BalanceReport) => {
    setReportState(r);
  }, []);

  const addHistory = useCallback((e: HistoryEntry) => {
    setHistory((prev) => [...prev, e]);
  }, []);

  return (
    <AppContext.Provider value={{ report, history, setReport, addHistory }}>
      {children}
    </AppContext.Provider>
  );
}
