import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { DistributionService } from "../distribution/distribution.service";
import { WaService } from "../whatsapp/wa.service";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import type { AuthContext } from "../auth/auth.types";
import type {
  AutomationEvent,
  AutomationNode,
  AutomationRunContext,
} from "./automation.types";

/**
 * Resultado da execução de um nó:
 *   - `nextNodeId`: próximo nó (null = fim do fluxo)
 *   - `delayMs`: quando definido, re-enfileira o `nextNodeId` com atraso
 *   - `output`: snapshot gravado em AutomationRunStep.output
 */
export interface NodeResult {
  nextNodeId: string | null;
  delayMs?: number;
  output?: Prisma.InputJsonValue;
}

/**
 * Registry de executores. Cada handler recebe o node tipado + contexto +
 * serviços, e retorna NodeResult. Lança exceção para falha — runner
 * captura e grava no step.
 *
 * Autor do fluxo paga por escolher actions seguras (ex.: enviar
 * WhatsApp fora da janela 24h lança — cai em FAILED). Runner não tenta
 * "corrigir" decisões do autor.
 */
@Injectable()
export class AutomationActions {
  private readonly logger = new Logger(AutomationActions.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly distribution: DistributionService,
    private readonly wa: WaService,
    @Inject(ENV_TOKEN) private readonly env: Env
  ) {}

  async execute(
    node: AutomationNode,
    ctx: AutomationRunContext
  ): Promise<NodeResult> {
    const event = ctx.event;
    const leadId = "leadId" in event ? event.leadId : null;

    switch (node.kind) {
      case "send_whatsapp_text": {
        if (!leadId) throw new Error("send_whatsapp_text exige leadId no evento");
        const body = await this.renderExpr(node.config.body, ctx, leadId);
        const msg = await this.wa.sendText({ leadId, body }, workerAuth(event));
        return { nextNodeId: node.next ?? null, output: { messageId: msg.id } };
      }

      case "send_whatsapp_template": {
        if (!leadId)
          throw new Error("send_whatsapp_template exige leadId no evento");
        const msg = await this.wa.sendTemplate(
          {
            leadId,
            templateName: node.config.templateName,
            languageCode: node.config.languageCode,
            components: node.config.components,
          },
          workerAuth(event)
        );
        return { nextNodeId: node.next ?? null, output: { messageId: msg.id } };
      }

      case "apply_tag": {
        if (!leadId) throw new Error("apply_tag exige leadId");
        await this.prisma.scoped.leadTagOnLead.upsert({
          where: { leadId_tagId: { leadId, tagId: node.config.tagId } },
          create: { leadId, tagId: node.config.tagId },
          update: {},
        });
        await this.prisma.scoped.leadEvent.create({
          data: {
            leadId,
            kind: "TAG_ADDED",
            payload: {
              tagId: node.config.tagId,
              by: "automation",
            } as Prisma.InputJsonValue,
          },
        });
        return { nextNodeId: node.next ?? null };
      }

      case "remove_tag": {
        if (!leadId) throw new Error("remove_tag exige leadId");
        await this.prisma.scoped.leadTagOnLead.deleteMany({
          where: { leadId, tagId: node.config.tagId },
        });
        await this.prisma.scoped.leadEvent.create({
          data: {
            leadId,
            kind: "TAG_REMOVED",
            payload: {
              tagId: node.config.tagId,
              by: "automation",
            } as Prisma.InputJsonValue,
          },
        });
        return { nextNodeId: node.next ?? null };
      }

      case "change_stage": {
        if (!leadId) throw new Error("change_stage exige leadId");
        const lead = await this.prisma.scoped.lead.findUnique({
          where: { id: leadId },
          select: { stageId: true },
        });
        if (!lead) throw new NotFoundException("Lead não encontrado");
        if (lead.stageId === node.config.stageId) {
          return { nextNodeId: node.next ?? null, output: { noop: true } };
        }
        await this.prisma.scoped.lead.update({
          where: { id: leadId },
          data: { stageId: node.config.stageId },
        });
        await this.prisma.scoped.leadEvent.create({
          data: {
            leadId,
            kind: "STAGE_CHANGED",
            payload: {
              from: lead.stageId,
              to: node.config.stageId,
              by: "automation",
            } as Prisma.InputJsonValue,
          },
        });
        return { nextNodeId: node.next ?? null };
      }

      case "change_status": {
        if (!leadId) throw new Error("change_status exige leadId");
        await this.prisma.scoped.lead.update({
          where: { id: leadId },
          data: { status: node.config.status },
        });
        await this.prisma.scoped.leadEvent.create({
          data: {
            leadId,
            kind: "STATUS_CHANGED",
            payload: {
              to: node.config.status,
              by: "automation",
            } as Prisma.InputJsonValue,
          },
        });
        return { nextNodeId: node.next ?? null };
      }

      case "assign_auto": {
        if (!leadId) throw new Error("assign_auto exige leadId");
        const r = await this.distribution.autoAssign(leadId, {
          reason: "AI_SUGGESTION",
        });
        return {
          nextNodeId: node.next ?? null,
          output: r ?? { skipped: true },
        };
      }

      case "assign_manual": {
        if (!leadId) throw new Error("assign_manual exige leadId");
        const r = await this.distribution.manualAssign(
          leadId,
          node.config.userId,
          workerAuth(event),
          "MANUAL_SUPERVISOR"
        );
        return { nextNodeId: node.next ?? null, output: r };
      }

      case "add_note": {
        if (!leadId) throw new Error("add_note exige leadId");
        const body = await this.renderExpr(node.config.body, ctx, leadId);
        const note = await this.prisma.scoped.leadNote.create({
          data: { leadId, authorId: workerAuth(event).userId, body },
          select: { id: true },
        });
        await this.prisma.scoped.leadEvent.create({
          data: {
            leadId,
            kind: "NOTE_ADDED",
            payload: {
              noteId: note.id,
              by: "automation",
            } as Prisma.InputJsonValue,
          },
        });
        return { nextNodeId: node.next ?? null, output: { noteId: note.id } };
      }

      case "wait": {
        const secs = Math.max(1, Math.floor(node.config.seconds));
        return {
          nextNodeId: node.next ?? null,
          delayMs: secs * 1000,
          output: { waitSeconds: secs },
        };
      }

      case "set_field": {
        if (!leadId) throw new Error("set_field exige leadId");
        const data: Record<string, unknown> = {};
        data[node.config.field] = node.config.value;
        await this.prisma.scoped.lead.update({
          where: { id: leadId },
          data: data as Prisma.LeadUpdateInput,
        });
        return { nextNodeId: node.next ?? null };
      }

      case "branch": {
        if (!leadId) {
          return { nextNodeId: node.falseNext };
        }
        const lead = await this.prisma.scoped.lead.findUnique({
          where: { id: leadId },
          select: {
            status: true,
            stageId: true,
            origin: true,
            productInterest: true,
            aiScore: true,
          },
        });
        if (!lead) return { nextNodeId: node.falseNext };
        const actual = lead[node.config.field] ?? null;
        const ok = evalCondition(actual, node.config.op, node.config.value);
        return {
          nextNodeId: ok ? node.trueNext : node.falseNext,
          output: { matched: ok, actual },
        };
      }

      case "stop":
        return { nextNodeId: null, output: { reason: node.config.reason ?? null } };

      case "ai_prompt": {
        const prompt = await this.renderExpr(node.config.prompt, ctx, leadId);
        const key = this.env.ANTHROPIC_API_KEY;
        if (!key) throw new Error("ANTHROPIC_API_KEY ausente — configure p/ usar node ai_prompt");
        const model = node.config.model ?? "claude-haiku-4-5-20251001";
        const body = {
          model,
          max_tokens: Math.min(Math.max(node.config.maxTokens ?? 512, 1), 4096),
          temperature: node.config.temperature ?? 0.3,
          messages: [{ role: "user", content: prompt }],
        };
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 30_000);
        let data: { content?: Array<{ text?: string }> };
        try {
          const resp = await fetch(`${this.env.ANTHROPIC_BASE_URL}/v1/messages`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-api-key": key,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(body),
            signal: ctrl.signal,
          });
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`Claude ${resp.status}: ${txt.slice(0, 300)}`);
          }
          data = (await resp.json()) as { content?: Array<{ text?: string }> };
        } finally {
          clearTimeout(t);
        }
        const text = (data.content ?? [])
          .map((c) => c?.text ?? "")
          .join("")
          .trim();
        const varName = node.config.outputVar ?? "ai_result";
        ctx.vars[varName] = text;
        return {
          nextNodeId: node.next ?? null,
          output: { model, outputVar: varName, chars: text.length },
        };
      }

      case "http_request": {
        const url = await this.renderExpr(node.config.url, ctx, leadId);
        const method = node.config.method ?? "GET";
        const headers: Record<string, string> = { "content-type": "application/json" };
        for (const [k, v] of Object.entries(node.config.headers ?? {})) {
          headers[k] = await this.renderExpr(String(v), ctx, leadId);
        }
        let payload: string | undefined;
        if (node.config.body !== undefined && method !== "GET") {
          const raw =
            typeof node.config.body === "string"
              ? node.config.body
              : JSON.stringify(node.config.body);
          payload = await this.renderExpr(raw, ctx, leadId);
        }
        const timeout = Math.min(Math.max(node.config.timeoutMs ?? 10_000, 500), 30_000);
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeout);
        try {
          const resp = await fetch(url, {
            method,
            headers,
            body: payload,
            signal: ctrl.signal,
          });
          const text = await resp.text();
          let parsed: unknown = text;
          try {
            parsed = JSON.parse(text);
          } catch {
            // mantém como string se não for JSON
          }
          const varName = node.config.outputVar ?? "http_response";
          ctx.vars[varName] = parsed as Record<string, unknown>;
          ctx.vars[`${varName}_status`] = resp.status;
          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status} em ${url}`);
          }
          return {
            nextNodeId: node.next ?? null,
            output: { status: resp.status, outputVar: varName },
          };
        } finally {
          clearTimeout(t);
        }
      }

      case "set_vars": {
        const out: Record<string, string> = {};
        for (const [k, tpl] of Object.entries(node.config.vars ?? {})) {
          const rendered = await this.renderExpr(String(tpl), ctx, leadId);
          ctx.vars[k] = rendered;
          out[k] = rendered;
        }
        return { nextNodeId: node.next ?? null, output: { set: out } };
      }

      default: {
        const _exhaustive: never = node;
        this.logger.error(`kind desconhecido: ${JSON.stringify(_exhaustive)}`);
        throw new Error("Node kind desconhecido");
      }
    }
  }

  /**
   * Renderiza uma string com placeholders `{{path.path}}` contra o
   * escopo {lead, event, vars, now}. Carrega o Lead apenas quando o
   * template referencia `lead.*` — evita query desnecessária.
   */
  async renderExpr(
    tpl: string,
    ctx: AutomationRunContext,
    leadId: string | null
  ): Promise<string> {
    if (!tpl || !tpl.includes("{{")) return tpl ?? "";
    const needsLead = leadId != null && /\{\{\s*lead\./.test(tpl);
    const lead = needsLead ? await this.loadLead(leadId!) : null;
    const now = new Date();
    const scope: RenderScope = {
      lead,
      event: ctx.event,
      vars: ctx.vars,
      now: {
        iso: now.toISOString(),
        date: now.toISOString().slice(0, 10),
        time: now.toISOString().slice(11, 19),
        ts: String(now.getTime()),
      },
    };
    return tpl.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, path: string) => {
      const parts = path.split(".");
      let cur: unknown = scope;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          return `{{${path}}}`;
        }
      }
      return cur == null ? "" : String(cur);
    });
  }

  private async loadLead(leadId: string): Promise<Record<string, unknown> | null> {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        phoneE164: true,
        email: true,
        status: true,
        stageId: true,
        origin: true,
        productInterest: true,
        cityGuess: true,
        ageGuess: true,
        aiScore: true,
      },
    });
    if (!lead) return null;
    return {
      ...lead,
      phone: lead.phoneE164,
      nome: lead.name,
      telefone: lead.phoneE164,
      score: lead.aiScore,
      etapa: lead.stageId,
      interesse: lead.productInterest,
      cidade: lead.cityGuess,
      idade: lead.ageGuess,
    };
  }
}

function evalCondition(
  actual: unknown,
  op: "eq" | "neq" | "in" | "gte" | "lte" | "exists",
  value: unknown
): boolean {
  switch (op) {
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    case "in":
      return Array.isArray(value) && (value as unknown[]).includes(actual);
    case "gte":
      return typeof actual === "number" &&
        typeof value === "number" &&
        actual >= value;
    case "lte":
      return typeof actual === "number" &&
        typeof value === "number" &&
        actual <= value;
    case "exists":
      return actual !== null && actual !== undefined;
    default:
      return false;
  }
}

/**
 * Engine de expressões. Suporta:
 *   - {{lead.nome}}, {{lead.phone}}, {{lead.email}}, {{lead.stage}}, etc.
 *   - {{event.text}}, {{event.kind}}, etc.
 *   - {{vars.ai_result}}, {{vars.http_response.foo}}
 *   - {{now}}, {{now.date}}, {{now.time}}
 *   - Caminhos aninhados: {{vars.http_response.data.id}}
 *
 * Se o placeholder não casar, mantém literal pra depurar. Escopo
 * propositalmente pequeno — sem eval, sem operadores, sem loops.
 * `lead` é carregado lazily e cacheado por chamada.
 */
type RenderScope = {
  lead: Record<string, unknown> | null;
  event: unknown;
  vars: Record<string, unknown>;
  now: Record<string, string>;
};

/**
 * AuthContext sintético para operações executadas pela automação.
 * userId fictício `__automation__` — AuditService e LeadEvent.actorId
 * aceitam qualquer uuid; aqui usamos um uuid fixo reservado para worker.
 */
export const AUTOMATION_WORKER_USER_ID =
  "00000000-0000-0000-0000-000000000002";

function workerAuth(event: AutomationEvent): AuthContext {
  return {
    userId: AUTOMATION_WORKER_USER_ID,
    tenantId: event.tenantId,
    role: "ADMIN",
    sessionId: "__automation__",
  };
}
