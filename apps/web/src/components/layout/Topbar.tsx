import { Bell, ChevronDown, Command, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/cn";
import { usuarios } from "@/lib/mock";
import type { Papel } from "@/lib/types";

const papelLabel: Record<Papel, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  supervisor: "Supervisor",
  corretor: "Corretor",
  sac: "SAC",
};

export function Topbar() {
  const { persona, setPersona } = useApp();
  const [open, setOpen] = useState(false);

  if (!persona) return null;

  return (
    <header className="h-14 border-b border-slate-200 bg-white/80 glass sticky top-0 z-20">
      <div className="h-full px-5 flex items-center gap-4">
        <div className="flex-1 max-w-[520px]">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar leads, clientes, tickets…"
            rightIcon={
              <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md bg-slate-100 text-slate-500 px-1.5 py-0.5 text-[10px] font-mono">
                <Command className="h-3 w-3" /> K
              </kbd>
            }
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="relative h-9 w-9 inline-flex items-center justify-center rounded-[10px] bg-brand-50 text-brand-700 hover:bg-brand-100 transition ring-focus">
            <Sparkles className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
          </button>

          <button className="relative h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 transition ring-focus">
            <Bell className="h-4 w-4 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse-soft" />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="h-9 px-2.5 inline-flex items-center gap-2 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 transition ring-focus"
            >
              <Badge tone="brand" className="text-[10px]">
                {papelLabel[persona.papel]}
              </Badge>
              <span className="text-sm font-medium text-slate-800">
                {persona.nome.split(" ")[0]}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {open && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 top-11 z-40 w-72 rounded-[14px] border border-slate-200 bg-white shadow-pop p-1.5 animate-slide-up">
                  <div className="px-2.5 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Trocar persona
                    </p>
                  </div>
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {usuarios.map((u) => {
                      const active = u.id === persona.id;
                      return (
                        <li key={u.id}>
                          <button
                            onClick={() => {
                              setPersona(u);
                              setOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-left text-sm hover:bg-slate-50 transition",
                              active && "bg-brand-50"
                            )}
                          >
                            <div
                              className={cn(
                                "h-7 w-7 rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 inline-flex items-center justify-center text-white text-[11px] font-semibold"
                              )}
                            >
                              {u.nome
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 truncate">
                                {u.nome}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {papelLabel[u.papel]}
                              </div>
                            </div>
                            {active && (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
