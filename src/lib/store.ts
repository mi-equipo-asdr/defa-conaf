"use client";

import { createContext, useContext } from "react";
import type { BalanceReport, HistoryEntry } from "./types";

export interface AppState {
  report: BalanceReport | null;
  history: HistoryEntry[];
  setReport: (r: BalanceReport) => void;
  addHistory: (e: HistoryEntry) => void;
}

export const AppContext = createContext<AppState>({
  report: null,
  history: [],
  setReport: () => {},
  addHistory: () => {},
});

export function useAppState() {
  return useContext(AppContext);
}
