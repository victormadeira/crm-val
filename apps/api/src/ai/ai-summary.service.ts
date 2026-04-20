import { Inject, Injectable, NotFoundException, OnModuleDestroy } from "@nestjs/common";
import IORedis from "ioredis";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";

const CACHE_TTL_SECONDS = 3600; // 1h (PRD)

/**
 * AI summary de um lead — resumo contextual para o vendedor abrir o deal e
 * entender status, próximos passos e gargalos. Usa Claude Haiku (cheap) e
 * cachea em Redis por 1h para evitar re-cobrar toda vez que a tela abre.
 * Invalidação explícita via `invalidate(leadId)` quando mensagem nova ou
 * stage muda (chamado pelos serviços relevantes).
 */
@Injectable()
export class AiSummaryService implements OnModuleDestroy {
  private readonly redis: IORedis;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV_TOKEN) private readonly env: Env
  ) {
    this.redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }

  private key(tenantId: string, leadId: string): string {
    return `ai:summary:${tenantId}:${leadId}`;
  }

  async invalidate(leadId: string): Promise<void> {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: leadId },
      select: { tenantId: true },
    });
    if (!lead) return;
    await this.redis.del(this.key(lead.tenantId, leadId));
  }

  async summarize(leadId: string, force = false): Promise<{
    summary: string;
    cached: boolean;
    generatedAt: string;
  }> {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        phoneE164: true,
        segment: true,
        origin: true,
        status: true,
        rottingStatus: true,
        blueprintCompletion: true,
        aiScore: true,
        scoreBreakdown: true,
        customFields: true,
        createdAt: true,
        lastContactAt: true,
        lastActivityAt: true,
        stage: { select: { name: true } },
        pipeline: { select: { name: true } },
        notes: { orderBy: { createdAt: "desc" }, take: 5, select: { body: true, createdAt: true } },
        tasks: {
          where: { status: "PENDING" },
          orderBy: { dueAt: "asc" },
          take: 5,
          select: { title: true, dueAt: true },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { title: true, valueCents: true, status: true, openedAt: true },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 15,
          select: { kind: true, createdAt: true, payload: true },
        },
      },
    });
    if (!lead) throw new NotFoundException("Lead não encontrado");

    const cacheKey = this.key(lead.tenantId, lead.id);
    if (!force) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            summary: string;
            generatedAt: string;
          };
          return { ...parsed, cached: true };
        } catch {
          // cache corrompido — recomputa
        }
      }
    }

    const prompt = buildPrompt(lead);
    const summary = await this.callClaude(prompt);
    const generatedAt = new Date().toISOString();

    await this.redis.setex(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify({ summary, generatedAt })
    );

    return { summary, cached: false, generatedAt };
  }

  private async callClaude(prompt: string): Promise<string> {
    const key = this.env.ANTHROPIC_API_KEY;
    if (!key) {
      return "[AI summary indisponível — ANTHROPIC_API_KEY não configurada]";
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const resp = await fetch(`${this.env.ANTHROPIC_BASE_URL}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          temperature: 0.3,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: ctrl.signal,
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Claude ${resp.status}: ${txt.slice(0, 200)}`);
      }
      const data = (await resp.json()) as {
        content?: Array<{ text?: string }>;
      };
      return (data.content ?? [])
        .map((c) => c?.text ?? "")
        .join("")
        .trim();
    } finally {
      clearTimeout(t);
    }
  }
}

function buildPrompt(lead: {
  name: string;
  segment: string | null;
  origin: string;
  status: string;
  rottingStatus: string;
  blueprintCompletion: number;
  aiScore: number | null;
  scoreBreakdown: unknown;
  customFields: unknown;
  createdAt: Date;
  lastContactAt: Date | null;
  lastActivityAt: Date | null;
  stage: { name: string } | null;
  pipeline: { name: string } | null;
  notes: Array<{ body: string; createdAt: Date }>;
  tasks: Array<{ title: string; dueAt: Date | null }>;
  proposals: Array<{
    title: string;
    valueCents: number;
    status: string;
    openedAt: Date | null;
  }>;
  events: Array<{ kind: string; createdAt: Date; payload: unknown }>;
}): string {
  const header = `Você é um assistente comercial do Valparaíso Adventure Park. Gere um resumo objetivo de 4 a 6 linhas em português brasileiro, tom direto, sem floreios. Inclua: (1) estado atual do deal e estágio, (2) últimos sinais de engajamento, (3) principal risco ou gargalo (se há rotting, blueprint incompleto, proposta não aberta), (4) próxima ação recomendada. Não invente fatos — só use o que está nos dados.`;
  const dataBlock = JSON.stringify(
    {
      nome: lead.name,
      pipeline: lead.pipeline?.name,
      estagio: lead.stage?.name,
      segmento: lead.segment,
      origem: lead.origin,
      status: lead.status,
      rotting: lead.rottingStatus,
      blueprintPct: lead.blueprintCompletion,
      score: lead.aiScore,
      scoreBreakdown: lead.scoreBreakdown,
      customFields: lead.customFields,
      criadoEm: lead.createdAt,
      ultimaAtividade: lead.lastActivityAt,
      ultimoContato: lead.lastContactAt,
      notasRecentes: lead.notes.map((n) => ({
        data: n.createdAt,
        texto: n.body.slice(0, 300),
      })),
      tarefasPendentes: lead.tasks,
      propostas: lead.proposals.map((p) => ({
        titulo: p.title,
        valor: p.valueCents / 100,
        status: p.status,
        abertaEm: p.openedAt,
      })),
      eventosRecentes: lead.events.slice(0, 10),
    },
    null,
    2
  );
  return `${header}\n\n<lead>\n${dataBlock}\n</lead>`;
}
