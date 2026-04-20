import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Beaker,
  Bell,
  Bot,
  Brain,
  Building2,
  CalendarDays,
  CalendarRange,
  CreditCard,
  FileBarChart,
  FileText,
  Filter,
  Gauge,
  Globe2,
  HardHat,
  Headphones,
  Inbox,
  Instagram as IGIcon,
  KanbanSquare,
  LineChart,
  LogOut,
  Mail,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Mic,
  Plug,
  QrCode,
  ScrollText,
  Settings,
  Shield,
  Shuffle,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Brand } from "@/components/Brand";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { Papel } from "@/lib/types";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Papel[];
  badge?: string;
  end?: boolean;
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Meu Espaço",
    items: [
      {
        to: "/meu-espaco",
        label: "Meu Espaço",
        icon: User,
        roles: ["gestor", "supervisor", "corretor", "sac", "admin"],
        badge: "5",
      },
    ],
  },
  {
    section: "Visão geral",
    items: [
      {
        to: "/",
        label: "Dashboard",
        icon: Gauge,
        roles: ["gestor", "supervisor", "admin"],
        end: true,
      },
      {
        to: "/inbox",
        label: "Minha fila",
        icon: Inbox,
        roles: ["corretor"],
        badge: "14",
      },
      {
        to: "/whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        roles: ["corretor"],
        badge: "3",
      },
      {
        to: "/whatsapp",
        label: "WhatsApp — Supervisão",
        icon: MessageCircle,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/instagram",
        label: "Instagram DMs",
        icon: IGIcon,
        roles: ["corretor", "gestor", "supervisor", "admin"],
        badge: "3",
      },
    ],
  },
  {
    section: "Vendas",
    items: [
      {
        to: "/pipeline",
        label: "Pipeline",
        icon: KanbanSquare,
        roles: ["gestor", "supervisor", "corretor"],
      },
      {
        to: "/router",
        label: "Roteamento IA",
        icon: Shuffle,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/ranking",
        label: "Ranking ao vivo",
        icon: Trophy,
        roles: ["gestor", "supervisor"],
      },
      {
        to: "/analytics",
        label: "Revenue Intelligence",
        icon: LineChart,
        roles: ["gestor", "supervisor"],
      },
      {
        to: "/forecast",
        label: "Forecast",
        icon: TrendingUp,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/canais",
        label: "Canais & ROI",
        icon: BarChart3,
        roles: ["gestor", "supervisor"],
      },
      {
        to: "/propostas",
        label: "Propostas",
        icon: FileText,
        roles: ["gestor", "supervisor", "corretor", "admin"],
      },
      {
        to: "/agenda",
        label: "Agenda",
        icon: CalendarDays,
        roles: ["gestor", "supervisor", "corretor", "admin"],
      },
      {
        to: "/voice-ai",
        label: "Voice AI",
        icon: Mic,
        roles: ["gestor", "supervisor", "admin"],
      },
    ],
  },
  {
    section: "Marketing",
    items: [
      {
        to: "/meta-ads",
        label: "Meta Ads",
        icon: Megaphone,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/tracking",
        label: "Tracking & Pixel",
        icon: LineChart,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/segmentos",
        label: "Segmentos",
        icon: Filter,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/email",
        label: "Email marketing",
        icon: Mail,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/landings",
        label: "Landing pages",
        icon: Globe2,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/testes-ab",
        label: "Testes A/B",
        icon: Beaker,
        roles: ["gestor", "supervisor", "admin"],
      },
    ],
  },
  {
    section: "Automação",
    items: [
      {
        to: "/automacoes",
        label: "Workflows",
        icon: Workflow,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/execucoes",
        label: "Execuções",
        icon: Activity,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/cadencias",
        label: "Cadências",
        icon: Sparkles,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/chatbot",
        label: "Chatbot IA",
        icon: Bot,
        roles: ["gestor", "supervisor", "admin"],
      },
    ],
  },
  {
    section: "Produto",
    items: [
      {
        to: "/passaportes",
        label: "Passaportes",
        icon: QrCode,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/renovacoes",
        label: "Renovações",
        icon: CalendarRange,
        roles: ["gestor", "supervisor", "admin"],
        badge: "4",
      },
      {
        to: "/checkout",
        label: "Pagamentos",
        icon: CreditCard,
        roles: ["gestor", "admin"],
      },
    ],
  },
  {
    section: "Operações",
    items: [
      {
        to: "/operacoes",
        label: "Central Operacional",
        icon: HardHat,
        roles: ["gestor", "supervisor", "admin"],
        badge: "3",
      },
    ],
  },
  {
    section: "Relacionamento",
    items: [
      {
        to: "/sac",
        label: "SAC",
        icon: Headphones,
        roles: ["gestor", "supervisor", "sac", "admin"],
        badge: "6",
      },
    ],
  },
  {
    section: "Time",
    items: [
      {
        to: "/comunicacao",
        label: "Aqua Chat",
        icon: MessagesSquare,
        roles: ["gestor", "supervisor", "corretor", "sac", "admin"],
        badge: "24",
      },
      {
        to: "/corretores",
        label: "Corretores",
        icon: Users,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/gamificacao",
        label: "Gamificação",
        icon: Target,
        roles: ["gestor", "supervisor", "corretor", "admin"],
      },
      {
        to: "/metas",
        label: "Metas & Comissões",
        icon: Wallet,
        roles: ["gestor", "admin"],
      },
    ],
  },
  {
    section: "IA",
    items: [
      {
        to: "/ia-aprendizado",
        label: "IA Aprendizado",
        icon: Brain,
        roles: ["gestor", "supervisor", "corretor", "admin"],
      },
      {
        to: "/alertas",
        label: "Alertas",
        icon: Bell,
        roles: ["gestor", "supervisor", "sac"],
        badge: "3",
      },
    ],
  },
  {
    section: "Dados & API",
    items: [
      {
        to: "/relatorios",
        label: "Relatórios",
        icon: FileBarChart,
        roles: ["gestor", "supervisor", "admin"],
      },
      {
        to: "/integracoes",
        label: "Integrações",
        icon: Plug,
        roles: ["gestor", "admin"],
      },
    ],
  },
  {
    section: "Governança",
    items: [
      {
        to: "/auditoria",
        label: "Auditoria",
        icon: ScrollText,
        roles: ["admin", "gestor"],
      },
      {
        to: "/lgpd",
        label: "LGPD & Privacidade",
        icon: Shield,
        roles: ["admin", "gestor"],
      },
      {
        to: "/unidades",
        label: "Unidades",
        icon: Building2,
        roles: ["admin"],
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        to: "/admin",
        label: "Administração",
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];

export function Sidebar() {
  const { persona, logout } = useApp();
  if (!persona) return null;

  return (
    <aside className="w-[248px] shrink-0 border-r border-slate-200 bg-white h-full flex flex-col">
      <div className="h-14 px-4 flex items-center border-b border-slate-100">
        <Brand size="md" />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {NAV.map((section) => {
          const visible = section.items.filter((i) =>
            i.roles.includes(persona.papel)
          );
          if (!visible.length) return null;
          return (
            <div key={section.section} className="mb-4">
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.section}
              </div>
              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center gap-2.5 h-9 px-2.5 rounded-[10px] text-[13px] font-medium transition-colors ring-focus",
                            isActive
                              ? "bg-brand-50 text-brand-700"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cn(
                                "h-[18px] w-[18px] shrink-0",
                                isActive
                                  ? "text-brand-600"
                                  : "text-slate-400 group-hover:text-slate-600"
                              )}
                            />
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                tone={isActive ? "brand" : "slate"}
                                className="h-4 px-1.5 text-[10px]"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={persona.nome} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-900 truncate">
              {persona.nome}
            </div>
            <div className="text-[11px] text-slate-500 capitalize">
              {persona.papel}
            </div>
          </div>
          <button
            onClick={logout}
            className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ring-focus"
            aria-label="Trocar persona"
            title="Trocar persona"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
