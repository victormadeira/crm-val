import { create } from "zustand";
import type { Papel } from "./types";

export type Persona = {
  id: string;
  nome: string;
  papel: Papel;
};

interface AppState {
  persona: Persona | null;
  setPersona: (p: Persona) => void;
  logout: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedLeadId: string | null;
  setSelectedLead: (id: string | null) => void;
}

const STORAGE_KEY = "aquapark.persona";

export const useApp = create<AppState>((set) => ({
  persona:
    typeof localStorage !== "undefined"
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
      : null,
  setPersona: (p) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    set({ persona: p });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ persona: null });
  },
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  selectedLeadId: "l9",
  setSelectedLead: (id) => set({ selectedLeadId: id }),
}));
