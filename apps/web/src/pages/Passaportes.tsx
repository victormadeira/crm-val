import { useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Download,
  Grid3x3,
  List,
  Plus,
  QrCode,
  Search,
  Ticket,
  Users,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { passaportes, renovacoesProximas } from "@/lib/mock";
import { dateShort, money } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Passaporte } from "@/lib/types";

const tipoLabel: Record<Passaporte["tipo"], string> = {
  anual_individual: "Anual Individual",
  anual_familia: "Anual Família",
  diario: "Diário",
  vip: "VIP",
};

const tipoTone: Record<
  Passaporte["tipo"],
  "brand" | "aqua" | "violet" | "amber"
> = {
  anual_individual: "brand",
  anual_familia: "aqua",
  diario: "slate" as any,
  vip: "violet",
};

// Simple ASCII-art QR fallback
function FakeQR({ code }: { code: string }) {
  return (
    <div className="relative h-32 w-32 rounded-[10px] bg-white border border-slate-200 p-2 shrink-0">
      <div
        className="h-full w-full bg-slate-900"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #0f172a 25%, transparent 25%),
            linear-gradient(-45deg, #0f172a 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #0f172a 75%),
            linear-gradient(-45deg, transparent 75%, #0f172a 75%)
          `,
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
        }}
      />
      <div className="absolute inset-2 pointer-events-none">
        <span className="absolute top-0 left-0 h-5 w-5 bg-white border-[3px] border-slate-900" />
        <span className="absolute top-0 right-0 h-5 w-5 bg-white border-[3px] border-slate-900" />
        <span className="absolute bottom-0 left-0 h-5 w-5 bg-white border-[3px] border-slate-900" />
        <span className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center">
            <QrCode className="h-4 w-4 text-slate-900" />
          </div>
        </span>
      </div>
    </div>
  );
}

function PassaporteCard({ p }: { p: Passaporte }) {
  const total = p.vigencia_fim
    ? Math.round(
        (new Date(p.vigencia_fim).getTime() -
          new Date(p.vigencia_inicio).getTime()) /
          86_400_000
      )
    : 365;
  const remain = p.dias_restantes ?? 0;
  const elapsed = total - Math.max(0, remain);
  const pctUsed = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const isExpiring = remain > 0 && remain <= 60;
  const isExpired = p.status === "expirado";

  return (
    <Card
      className={cn(
        "hover:shadow-pop transition-shadow group overflow-hidden",
        isExpiring && "ring-1 ring-amber-300",
        isExpired && "opacity-70"
      )}
    >
      <div
        className={cn(
          "h-1.5 w-full bg-gradient-to-r",
          p.tipo === "vip"
            ? "from-violet-500 to-fuchsia-500"
            : p.tipo === "anual_familia"
            ? "from-aqua-500 to-brand-600"
            : p.tipo === "anual_individual"
            ? "from-brand-500 to-brand-700"
            : "from-slate-400 to-slate-600"
        )}
      />
      <CardBody className="pt-5">
        <div className="flex items-start gap-4">
          <FakeQR code={p.qr_code} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                  {tipoLabel[p.tipo]}
                </p>
                <h3 className="text-[15px] font-semibold text-slate-900 truncate mt-0.5">
                  {p.cliente_nome}
                </h3>
              </div>
              <Badge
                tone={
                  p.status === "ativo"
                    ? "emerald"
                    : p.status === "expirado"
                    ? "rose"
                    : "slate"
                }
                dot
              >
                {p.status}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 tabular">
              <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] text-slate-700">
                {p.qr_code}
              </code>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-500">
                  {isExpired ? "Expirado" : `${remain} dias restantes`}
                </span>
                <span className="tabular font-medium text-slate-700">
                  {dateShort(p.vigencia_inicio)}
                  {p.vigencia_fim && ` → ${dateShort(p.vigencia_fim)}`}
                </span>
              </div>
              <Progress
                value={pctUsed}
                tone={
                  isExpired
                    ? "rose"
                    : isExpiring
                    ? "amber"
                    : "brand"
                }
              />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-slate-500 tabular">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {p.visitas.length} visitas
                </span>
                {p.renovacoes > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3" /> {p.renovacoes}ª renovação
                  </span>
                )}
              </div>
              <span className="text-[13px] font-semibold text-slate-900 tabular">
                {money(p.valor_pago)}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function Passaportes() {
  const [tab, setTab] = useState("todos");
  const [openWizard, setOpenWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [cadenciaAberta, setCadenciaAberta] = useState(false);
  const [busca, setBusca] = useState("");

  const filtered = passaportes
    .filter((p) =>
      tab === "todos"
        ? true
        : tab === "ativos"
        ? p.status === "ativo"
        : tab === "vencendo"
        ? (p.dias_restantes ?? 999) <= 60 && p.status === "ativo"
        : tab === "expirados"
        ? p.status === "expirado"
        : true
    )
    .filter((p) => {
      if (!busca) return true;
      const q = busca.toLowerCase();
      return (
        p.cliente_nome.toLowerCase().includes(q) ||
        p.qr_code.toLowerCase().includes(q)
      );
    });

  const ativos = passaportes.filter((p) => p.status === "ativo").length;
  const totalReceita = passaportes.reduce((s, p) => s + p.valor_pago, 0);

  return (
    <>
      <PageHeader
        title="Passaportes"
        subtitle={`${ativos} ativos • ${money(totalReceita)} emitido`}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => {
                const rows = [
                  ["QR", "Cliente", "Tipo", "Status", "Valor", "Vigência início", "Vigência fim", "Dias restantes"],
                  ...passaportes.map((p) => [
                    p.qr_code,
                    p.cliente_nome,
                    tipoLabel[p.tipo],
                    p.status,
                    String(p.valor_pago),
                    p.vigencia_inicio,
                    p.vigencia_fim ?? "",
                    String(p.dias_restantes ?? ""),
                  ]),
                ];
                const csv = rows
                  .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `passaportes.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setWizardStep(1);
                setOpenWizard(true);
              }}
            >
              Emitir passaporte
            </Button>
          </>
        }
      />

      <PageContent className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardBody className="py-4">
              <p className="text-[12px] text-slate-500">Anuais ativos</p>
              <p className="text-[22px] font-semibold tabular mt-0.5">
                {passaportes.filter((p) =>
                  ["anual_individual", "anual_familia"].includes(p.tipo)
                ).length}
              </p>
              <Badge tone="brand" className="mt-2">
                +12 este mês
              </Badge>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-[12px] text-slate-500">VIPs</p>
              <p className="text-[22px] font-semibold tabular mt-0.5">
                {passaportes.filter((p) => p.tipo === "vip").length}
              </p>
              <Badge tone="violet" className="mt-2">
                Ticket médio R$ 4.2k
              </Badge>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-[12px] text-slate-500">Vencendo em 60d</p>
              <p className="text-[22px] font-semibold tabular mt-0.5">
                {renovacoesProximas.length}
              </p>
              <Badge tone="amber" className="mt-2" dot>
                Cadência ativa
              </Badge>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-[12px] text-slate-500">Taxa de renovação</p>
              <p className="text-[22px] font-semibold tabular mt-0.5">
                68%
              </p>
              <Badge tone="emerald" className="mt-2">
                +4% vs. trimestre
              </Badge>
            </CardBody>
          </Card>
        </div>

        {/* Renovações alert */}
        {renovacoesProximas.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardBody className="py-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-[10px] bg-amber-100 inline-flex items-center justify-center text-amber-700 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-semibold text-amber-900">
                      Jornada de renovação proativa
                    </h4>
                    <Badge tone="amber" dot>
                      {renovacoesProximas.length} passaportes
                    </Badge>
                  </div>
                  <p className="text-[12px] text-amber-800 mt-1">
                    D-60 → D-45 → D-30 → D-15 disparados via n8n com mensagens
                    personalizadas e desconto progressivo.
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {renovacoesProximas.slice(0, 3).map((p) => (
                      <Badge key={p.id} tone="amber" className="text-[11px]">
                        {p.cliente_nome.split(" ")[0]} • {p.dias_restantes}d
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCadenciaAberta(true)}
                >
                  Ver cadência
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Tabs + grid */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "todos", label: "Todos", count: passaportes.length },
              { id: "ativos", label: "Ativos", count: ativos },
              {
                id: "vencendo",
                label: "Vencendo",
                count: renovacoesProximas.length,
              },
              { id: "expirados", label: "Expirados" },
            ]}
          />
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar por nome, CPF ou QR…"
            className="w-72"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <PassaporteCard key={p.id} p={p} />
          ))}
        </div>
      </PageContent>

      {/* Wizard de emissão */}
      <Dialog
        open={openWizard}
        onClose={() => setOpenWizard(false)}
        size="lg"
        title="Emitir novo passaporte"
        subtitle={`Passo ${wizardStep} de 4`}
        footer={
          <>
            {wizardStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setWizardStep(wizardStep - 1)}
              >
                Voltar
              </Button>
            )}
            <Button
              onClick={() => {
                if (wizardStep < 4) setWizardStep(wizardStep + 1);
                else setOpenWizard(false);
              }}
            >
              {wizardStep < 4 ? "Avançar" : "Emitir e enviar"}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex-1">
              <div
                className={cn(
                  "h-1 rounded-full transition-all",
                  n <= wizardStep ? "bg-brand-600" : "bg-slate-200"
                )}
              />
              <div
                className={cn(
                  "text-[11px] mt-1.5 font-medium",
                  n <= wizardStep ? "text-brand-700" : "text-slate-400"
                )}
              >
                {
                  ["Cliente", "Tipo & vigência", "Pagamento", "Confirmar"][
                    n - 1
                  ]
                }
              </div>
            </div>
          ))}
        </div>

        {wizardStep === 1 && (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-slate-600">
                Buscar cliente ou lead
              </label>
              <Input
                leftIcon={<Search className="h-4 w-4" />}
                placeholder="Nome, CPF, telefone ou e-mail"
                className="mt-1"
              />
            </div>
            <div className="rounded-[10px] border border-slate-200 p-3 bg-slate-50/60">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
                Sugestões recentes
              </p>
              {["Camila Rezende", "Patrícia Melo", "Ricardo Duarte"].map(
                (n) => (
                  <button
                    key={n}
                    className="w-full text-left py-1.5 text-[13px] hover:bg-white rounded px-2"
                  >
                    {n}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(tipoLabel).map(([k, v]) => (
                <button
                  key={k}
                  className="p-4 rounded-[12px] border border-slate-200 hover:border-brand-500 hover:bg-brand-50/30 text-left transition"
                >
                  <QrCode className="h-5 w-5 text-brand-600 mb-2" />
                  <div className="font-semibold text-[14px]">{v}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {k.includes("anual")
                      ? "365 dias • renovação automática"
                      : k === "vip"
                      ? "Benefícios exclusivos • fila preferencial"
                      : "1 dia • válido no dia escolhido"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-slate-600">
                Valor
              </label>
              <Input defaultValue="R$ 2.890,00" className="mt-1" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">
                Forma de pagamento
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {["PIX", "Cartão 12x", "Boleto"].map((m) => (
                  <button
                    key={m}
                    className="p-3 rounded-[10px] border border-slate-200 hover:border-brand-500 text-[13px] font-medium"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {wizardStep === 4 && (
          <div className="rounded-[12px] bg-gradient-to-br from-brand-50 to-aqua-50 p-5 border border-brand-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-600 text-white inline-flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Tudo pronto para emissão
                </h3>
                <p className="text-[12px] text-slate-600">
                  QR único será gerado e enviado via WhatsApp + e-mail
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-[13px]">
              <li className="flex items-center gap-2 text-slate-700">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Camila Rezende
                • CPF 123.456.789-00
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Anual Família
                (4 pessoas) • 365 dias
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> R$ 2.890,00
                em 12× no cartão
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Cadência de
                renovação D-60 agendada
              </li>
            </ul>
          </div>
        )}
      </Dialog>

      <Dialog
        open={cadenciaAberta}
        onClose={() => setCadenciaAberta(false)}
        title="Cadência de renovação proativa"
        subtitle="Disparada via n8n • desconto progressivo"
        size="lg"
        footer={
          <Button onClick={() => setCadenciaAberta(false)}>Fechar</Button>
        }
      >
        <div className="space-y-3">
          {[
            { etapa: "D-60", canal: "WhatsApp", msg: "Primeiro contato amigável — relembrar benefícios", desconto: "5% antecipação" },
            { etapa: "D-45", canal: "E-mail", msg: "Depoimento de cliente + reforço de valor", desconto: "8% antecipação" },
            { etapa: "D-30", canal: "WhatsApp", msg: "Oferta personalizada com base em visitas", desconto: "12% antecipação" },
            { etapa: "D-15", canal: "Corretor humano", msg: "Ligação ativa do corretor responsável", desconto: "15% última chance" },
          ].map((s) => (
            <div
              key={s.etapa}
              className="flex items-center gap-3 p-3 rounded-[10px] border border-slate-200"
            >
              <div className="h-10 w-14 rounded-[8px] bg-brand-50 text-brand-700 inline-flex items-center justify-center font-bold text-[13px] tabular shrink-0">
                {s.etapa}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-900">
                    {s.canal}
                  </span>
                  <Badge tone="emerald" className="text-[10px]">
                    {s.desconto}
                  </Badge>
                </div>
                <p className="text-[12px] text-slate-500 mt-0.5">{s.msg}</p>
              </div>
            </div>
          ))}
          <div className="mt-4 rounded-[10px] bg-amber-50/60 border border-amber-200 p-3 flex items-start gap-2">
            <Calendar className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-900">
              {renovacoesProximas.length} passaportes em jornada agora. Taxa
              média de renovação: 68%.
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
}
