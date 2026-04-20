import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Headphones,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/lib/store";
import { usuarios } from "@/lib/mock";
import { cn } from "@/lib/cn";
import type { Papel } from "@/lib/types";

const personaCards: {
  papel: Papel;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    papel: "gestor",
    label: "Gestor",
    sub: "Visão macro, forecast, ROI",
    icon: Crown,
    color: "from-brand-600 to-aqua-500",
  },
  {
    papel: "supervisor",
    label: "Supervisor",
    sub: "Pipeline, ranking ao vivo",
    icon: ShieldCheck,
    color: "from-violet-500 to-brand-500",
  },
  {
    papel: "corretor",
    label: "Corretor",
    sub: "Fila, Copilot IA, conversas",
    icon: Users,
    color: "from-emerald-500 to-aqua-500",
  },
  {
    papel: "sac",
    label: "Atendente SAC",
    sub: "Tickets, histórico cliente",
    icon: Headphones,
    color: "from-amber-500 to-rose-500",
  },
  {
    papel: "admin",
    label: "Administrador",
    sub: "Usuários, regras, integrações",
    icon: Settings,
    color: "from-slate-600 to-slate-900",
  },
];

export function Login() {
  const { setPersona } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Papel>("gestor");

  const pick = (papel: Papel) => {
    const u = usuarios.find((u) => u.papel === papel);
    if (u) {
      setPersona(u);
      navigate(papel === "corretor" ? "/inbox" : papel === "sac" ? "/sac" : "/");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">
      {/* Left */}
      <div className="flex flex-col justify-between p-10 lg:p-14 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="relative">
          <Brand size="lg" />
        </div>

        <div className="relative max-w-xl">
          <h1 className="text-[42px] leading-[1.08] font-semibold tracking-tight text-slate-900">
            O CRM que{" "}
            <span className="bg-gradient-to-r from-brand-600 to-aqua-500 bg-clip-text text-transparent">
              aprende
            </span>{" "}
            com cada venda.
          </h1>
          <p className="text-[17px] text-slate-600 mt-5 leading-relaxed text-balance">
            Pipeline inteligente, roteamento por IA, avaliação em tempo real e
            motor de aprendizado contínuo — desenhado verticalmente para
            operações de parques aquáticos.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Copilot IA sugere a próxima mensagem em tempo real",
              "Score dinâmico atualiza a cada interação do lead",
              "Ranking de corretores ao vivo via WebSocket",
              "Renovação proativa D-60 → D-15 totalmente automatizada",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-[12px] text-slate-400">
          Aquapark CRM • PRD v1.0 • © 2026
        </div>
      </div>

      {/* Right */}
      <div className="bg-gradient-to-br from-slate-50 via-brand-50/30 to-aqua-50/30 flex items-center justify-center p-8 lg:p-14">
        <div className="w-full max-w-md">
          <div className="rounded-[18px] border border-slate-200 bg-white shadow-pop p-7">
            <h2 className="text-xl font-semibold text-slate-900">
              Entrar no sistema
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Selecione uma persona para navegar no CRM.
            </p>

            <div className="mt-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                  E-mail
                </label>
                <Input
                  defaultValue="renata.carvalho@aquapark.com.br"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Senha
                </label>
                <Input
                  type="password"
                  defaultValue="••••••••••"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Ou entrar como
              </p>
              <div className="grid grid-cols-2 gap-2">
                {personaCards.map((p) => {
                  const Icon = p.icon;
                  const active = selected === p.papel;
                  return (
                    <button
                      key={p.papel}
                      onClick={() => setSelected(p.papel)}
                      className={cn(
                        "group relative text-left p-3 rounded-[12px] border transition-all ring-focus",
                        active
                          ? "border-brand-500 bg-brand-50/50 shadow-soft"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-[9px] bg-gradient-to-br inline-flex items-center justify-center text-white mb-2 shadow-soft",
                          p.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-[13px] font-semibold text-slate-900">
                        {p.label}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {p.sub}
                      </div>
                      {active && (
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={() => pick(selected)}
              className="w-full mt-6"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Entrar como {personaCards.find((p) => p.papel === selected)?.label}
            </Button>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Ambiente de demonstração • Troque de persona a qualquer momento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
