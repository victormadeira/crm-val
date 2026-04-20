import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

interface ScoreRule {
  key: string;
  label: string;
  points: number;
  /** true se a regra se aplica a este lead. */
  applies: boolean;
}

/**
 * Lead scoring heurístico (Acquapark PRD Fase 4). Score 0-100 baseado em
 * regras explícitas — zero custo de API, transparente pro vendedor, e
 * armazenamos o breakdown em Lead.scoreBreakdown pra debug.
 *
 * Recalculado automaticamente por:
 *   - create (LeadsService)
 *   - update (quando campos relevantes mudam)
 *   - move de stage
 *   - rotting change (via cron)
 *   - proposal opened/not-opened
 *
 * Pontuação (PRD p.14):
 *  +30  grupo escolar > 100 alunos
 *  +30  evento corporativo com data definida
 *  +25  indicação de cliente anterior (tag "indicacao")
 *  +20  origem parceiro (tag "parceiro" ou segment PACOTES_CONVENIOS)
 *  +20  respondeu proposta < 24h
 *  +15  proposta aberta (tracking)
 *  +15  data pretendida < 15 dias (urgência)
 *  +10  origem WhatsApp direto/orgânico
 *  -10  rotting WARNING
 *  -25  rotting ROTTEN
 *  -20  proposta não aberta > 5 dias
 *  -10  blueprint < 50% preenchido
 */
@Injectable()
export class LeadScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalcula score do lead e persiste aiScore + scoreBreakdown. Retorna
   * novo score (0..100).
   */
  async recompute(leadId: string): Promise<number> {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        origin: true,
        segment: true,
        rottingStatus: true,
        blueprintCompletion: true,
        customFields: true,
        tags: { select: { tag: { select: { name: true } } } },
        proposals: {
          where: { status: { in: ["SENT", "OPENED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            sentAt: true,
            openedAt: true,
          },
        },
      },
    });
    if (!lead) return 0;

    const tagNames = new Set(lead.tags.map((t) => t.tag.name.toLowerCase()));
    const customFields = (lead.customFields ?? {}) as Record<string, unknown>;
    const numParticipantes = asNumber(customFields.numParticipantes);
    const dataPretendida = asDate(customFields.dataPretendida);
    const dataEvento = asDate(customFields.dataEvento);
    const eventDate = dataPretendida ?? dataEvento;

    const rules: ScoreRule[] = [];

    rules.push({
      key: "grupo_escolar_100+",
      label: "Grupo escolar > 100 alunos",
      points: 30,
      applies:
        lead.segment === "GRUPOS_ESCOLARES" &&
        numParticipantes !== null &&
        numParticipantes > 100,
    });

    rules.push({
      key: "corp_data_definida",
      label: "Evento corporativo com data definida",
      points: 30,
      applies: lead.segment === "EVENTOS_CORPORATIVOS" && eventDate !== null,
    });

    rules.push({
      key: "indicacao",
      label: "Indicação de cliente anterior",
      points: 25,
      applies: tagNames.has("indicacao") || tagNames.has("indicação"),
    });

    rules.push({
      key: "origem_parceiro",
      label: "Origem parceiro",
      points: 20,
      applies:
        lead.origin === "REFERRAL" ||
        lead.segment === "PACOTES_CONVENIOS" ||
        tagNames.has("parceiro"),
    });

    const [prop] = lead.proposals;
    if (prop && prop.sentAt && prop.openedAt) {
      const hoursToOpen =
        (prop.openedAt.getTime() - prop.sentAt.getTime()) / 3_600_000;
      rules.push({
        key: "resposta_proposta_24h",
        label: "Respondeu proposta < 24h",
        points: 20,
        applies: hoursToOpen <= 24,
      });
      rules.push({
        key: "proposta_aberta",
        label: "Proposta aberta (tracking)",
        points: 15,
        applies: true,
      });
    }

    rules.push({
      key: "urgencia_data",
      label: "Data pretendida < 15 dias",
      points: 15,
      applies:
        eventDate !== null &&
        (eventDate.getTime() - Date.now()) / 86_400_000 < 15 &&
        (eventDate.getTime() - Date.now()) > 0,
    });

    rules.push({
      key: "whatsapp_organico",
      label: "Origem WhatsApp direto/orgânico",
      points: 10,
      applies: lead.origin === "ORGANIC" || lead.origin === "WALK_IN",
    });

    rules.push({
      key: "rotting_warning",
      label: "Deal rotting: warning",
      points: -10,
      applies: lead.rottingStatus === "WARNING",
    });

    rules.push({
      key: "rotting_rotten",
      label: "Deal rotting: rotten",
      points: -25,
      applies: lead.rottingStatus === "ROTTEN",
    });

    if (prop && prop.sentAt && !prop.openedAt) {
      const daysSinceSent = (Date.now() - prop.sentAt.getTime()) / 86_400_000;
      rules.push({
        key: "proposta_nao_aberta_5d",
        label: "Proposta não aberta > 5 dias",
        points: -20,
        applies: daysSinceSent > 5,
      });
    }

    rules.push({
      key: "blueprint_incompleto",
      label: "Blueprint < 50% preenchido",
      points: -10,
      applies: lead.blueprintCompletion < 50,
    });

    const applied = rules.filter((r) => r.applies);
    const total = applied.reduce((s, r) => s + r.points, 0);
    const clamped = Math.max(0, Math.min(100, total));

    const breakdown = {
      total: clamped,
      rawTotal: total,
      rules: applied.map((r) => ({
        key: r.key,
        label: r.label,
        points: r.points,
      })),
      computedAt: new Date().toISOString(),
    };

    await this.prisma.scoped.lead.update({
      where: { id: leadId },
      data: {
        aiScore: clamped,
        scoreBreakdown: breakdown as unknown as Prisma.InputJsonValue,
      },
    });

    return clamped;
  }
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
