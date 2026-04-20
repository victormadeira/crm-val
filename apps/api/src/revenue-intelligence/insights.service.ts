import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { InsightPriority, InsightType } from "@prisma/client";
import type { InsightFeedback } from "@valparaiso/shared";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { CorrelationService } from "./correlation.service";
import { ForecastService } from "./forecast.service";
import { PricingService } from "./pricing.service";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1800;

interface InsightPayload {
  insights: Array<{
    type: InsightType;
    priority: InsightPriority;
    title: string;
    description: string;
    targetDate?: string;
    impactEstimateCents?: number;
    actionSuggested?: string;
    whatsappMessage?: string;
  }>;
}

/**
 * Gera insights diários via Claude Haiku. Prompt injeta: previsão 14d,
 * correlação histórica, grade de preços atual e média de receita por
 * categoria. Saída JSON estruturada, validada e persistida em
 * RevenueInsight. Fallback rule-based se API indisponível.
 */
@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV_TOKEN) private readonly env: Env,
    private readonly forecast: ForecastService,
    private readonly correlation: CorrelationService,
    private readonly pricing: PricingService
  ) {}

  async list(params: { since?: string; limit?: number } = {}) {
    const where: Record<string, unknown> = {};
    if (params.since) {
      where.generatedAt = { gte: new Date(params.since) };
    }
    return this.prisma.scoped.revenueInsight.findMany({
      where,
      orderBy: [{ priority: "asc" }, { generatedAt: "desc" }],
      take: params.limit ?? 50,
    });
  }

  async feedback(id: string, input: InsightFeedback) {
    const existing = await this.prisma.scoped.revenueInsight.findFirst({
      where: { id },
    });
    if (!existing) throw new NotFoundException("insight não encontrado");
    return this.prisma.scoped.revenueInsight.update({
      where: { id: existing.id },
      data: {
        actionTaken: input.actionTaken,
        actualOutcomeCents: input.actualOutcomeCents ?? null,
      },
    });
  }

  /**
   * Gera e persiste um batch de insights. Idempotente por dia —
   * retorna existentes se já há >=3 insights de hoje.
   */
  async generate(): Promise<{ count: number; cached: boolean }> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todaysCount = await this.prisma.scoped.revenueInsight.count({
      where: { generatedAt: { gte: todayStart } },
    });
    if (todaysCount >= 3) {
      return { count: todaysCount, cached: true };
    }

    const [forecast, correlation, priceGridToday] = await Promise.all([
      this.forecast.forecastDays(14),
      this.correlation.latest(),
      this.pricing.priceGrid(new Date().toISOString().slice(0, 10)),
    ]);

    const payload = await this.callClaude({
      forecast,
      correlation,
      priceGridToday,
    });
    const insights = payload?.insights ?? [];

    if (insights.length === 0) {
      const fallback = this.ruleBasedFallback(forecast);
      for (const f of fallback) {
        await this.prisma.scoped.revenueInsight.create({
          data: scopedData({
            insightType: f.type,
            priority: f.priority,
            title: f.title,
            description: f.description,
            targetDate: f.targetDate
              ? new Date(f.targetDate + "T00:00:00Z")
              : null,
            impactEstimateCents: f.impactEstimateCents ?? null,
            actionSuggested: f.actionSuggested ?? null,
            whatsappMessage: f.whatsappMessage ?? null,
            modelVersion: "fallback-rule-v1",
          }),
        });
      }
      return { count: fallback.length, cached: false };
    }

    for (const i of insights) {
      await this.prisma.scoped.revenueInsight.create({
        data: scopedData({
          insightType: i.type,
          priority: i.priority,
          title: i.title.slice(0, 200),
          description: i.description.slice(0, 2000),
          targetDate: i.targetDate
            ? new Date(i.targetDate + "T00:00:00Z")
            : null,
          impactEstimateCents: i.impactEstimateCents ?? null,
          actionSuggested: i.actionSuggested?.slice(0, 1000) ?? null,
          whatsappMessage: i.whatsappMessage?.slice(0, 600) ?? null,
          modelVersion: MODEL,
          contextJson: { forecastSummary: forecast.slice(0, 14) },
        }),
      });
    }
    return { count: insights.length, cached: false };
  }

  private async callClaude(context: {
    forecast: unknown;
    correlation: unknown;
    priceGridToday: unknown;
  }): Promise<InsightPayload | null> {
    const key = this.env.ANTHROPIC_API_KEY;
    if (!key) {
      this.logger.warn("ANTHROPIC_API_KEY ausente — usando fallback");
      return null;
    }
    const prompt = buildPrompt(context);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25_000);
    try {
      const resp = await fetch(`${this.env.ANTHROPIC_BASE_URL}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: 0.4,
          system:
            "Você é analista de receita de parque aquático. Responda APENAS com JSON válido no schema { insights: [...] }. Não inclua markdown, prefácios ou explicações.",
          messages: [{ role: "user", content: prompt }],
        }),
        signal: ctrl.signal,
      });
      if (!resp.ok) {
        this.logger.warn(`Claude ${resp.status}: ${await resp.text()}`);
        return null;
      }
      const data = (await resp.json()) as {
        content?: Array<{ text?: string }>;
      };
      const raw = (data.content ?? [])
        .map((c) => c?.text ?? "")
        .join("")
        .trim();
      const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
      try {
        const parsed = JSON.parse(cleaned) as InsightPayload;
        if (!parsed.insights || !Array.isArray(parsed.insights)) return null;
        return parsed;
      } catch (err) {
        this.logger.warn(`JSON inválido do Claude: ${String(err)}`);
        return null;
      }
    } catch (err) {
      this.logger.warn(`Claude call falhou: ${String(err)}`);
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  private ruleBasedFallback(
    forecast: Array<{
      date: string;
      weatherCategory: string;
      expectedRevenueCents: number;
      dayType: string;
    }>
  ): InsightPayload["insights"] {
    const out: InsightPayload["insights"] = [];
    for (const day of forecast.slice(0, 7)) {
      if (
        day.weatherCategory === "EXCELENTE" &&
        (day.dayType === "FIM_DE_SEMANA" || day.dayType === "FERIADO")
      ) {
        out.push({
          type: "OPORTUNIDADE",
          priority: "ALTA",
          title: `Pico previsto em ${day.date}`,
          description: `Clima excelente + ${day.dayType}. Ative campanhas p/ maximizar receita.`,
          targetDate: day.date,
          impactEstimateCents: Math.round(day.expectedRevenueCents * 0.15),
          actionSuggested:
            "Disparar WhatsApp p/ leads quentes; ajustar preço p/ ceiling.",
          whatsappMessage: `🔆 Dia perfeito em ${day.date}! Garanta seu ingresso já.`,
        });
      } else if (day.weatherCategory === "PESSIMO") {
        out.push({
          type: "RISCO",
          priority: "ALTA",
          title: `Clima ruim em ${day.date}`,
          description:
            "Receita esperada reduzida. Considere promoção de emergência ou realocar staff.",
          targetDate: day.date,
          actionSuggested: "Aplicar desconto de 20% p/ manter fluxo.",
        });
      }
    }
    return out.slice(0, 5);
  }
}

function buildPrompt(ctx: {
  forecast: unknown;
  correlation: unknown;
  priceGridToday: unknown;
}): string {
  return `CONTEXTO: Parque aquático Valparaíso, São Luís/MA. Receita depende fortemente do clima.

PREVISÃO 14 DIAS (score clima 0-100, categoria, dia útil/fds/feriado, receita esperada em centavos):
${JSON.stringify(ctx.forecast, null, 2)}

CORRELAÇÃO HISTÓRICA (regressão linear clima×receita):
${JSON.stringify(ctx.correlation, null, 2)}

PREÇOS RECOMENDADOS HOJE:
${JSON.stringify(ctx.priceGridToday, null, 2)}

TAREFA: gere 3-6 insights acionáveis classificados em:
- OPORTUNIDADE: janela de pico a explorar
- RISCO: queda prevista, mitigar
- ACAO: mudança imediata (preço, staff, campanha)
- SAZONALIDADE: tendência > 7 dias

Responda APENAS com JSON:
{
  "insights": [
    {
      "type": "OPORTUNIDADE"|"RISCO"|"ACAO"|"SAZONALIDADE",
      "priority": "ALTA"|"MEDIA"|"BAIXA",
      "title": "até 80 chars",
      "description": "1-3 frases, objetivo",
      "targetDate": "YYYY-MM-DD" (se aplicável),
      "impactEstimateCents": number (se estimável),
      "actionSuggested": "ação direta",
      "whatsappMessage": "mensagem pronta p/ disparo em leads" (se aplicável)
    }
  ]
}`;
}
