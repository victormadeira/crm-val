import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";
import { AutomationBus } from "./automation.bus";
import { AutomationQueue } from "./automation.queue";
import { EVENT_TO_TRIGGER, type AutomationEvent } from "./automation.types";

/**
 * Inscreve-se em AutomationBus e, pra cada evento:
 *   1. Busca os AutomationFlow ativos do tenant com trigger correspondente.
 *   2. Aplica filtros de triggerCfg (ex.: origin == META_ADS).
 *   3. Cria AutomationRun (PENDING) e enfileira o primeiro tick.
 *
 * Rodamos dentro de TenantContext.run porque o evento já carrega
 * tenantId — precisamos abrir o contexto para que o Prisma scoped
 * injete tenantId nas queries.
 */
@Injectable()
export class AutomationDispatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(AutomationDispatcher.name);
  private unsub: (() => void) | null = null;

  constructor(
    private readonly bus: AutomationBus,
    private readonly prisma: PrismaService,
    private readonly queue: AutomationQueue
  ) {}

  onApplicationBootstrap(): void {
    this.unsub = this.bus.subscribe((event) =>
      TenantContext.run(
        { tenantId: event.tenantId, userId: "__dispatcher__" },
        () => this.dispatch(event)
      )
    );
  }

  onModuleDestroy(): void {
    this.unsub?.();
  }

  private async dispatch(event: AutomationEvent): Promise<void> {
    const trigger = EVENT_TO_TRIGGER[event.kind];
    const flows = await this.prisma.scoped.automationFlow.findMany({
      where: { trigger, status: "ACTIVE" },
      select: { id: true, triggerCfg: true },
    });
    if (flows.length === 0) return;

    for (const flow of flows) {
      if (!matchesCfg(flow.triggerCfg, event)) continue;
      try {
        const leadId = "leadId" in event ? event.leadId : null;
        const run = await this.prisma.scoped.automationRun.create({
          data: scopedData({
            flowId: flow.id,
            leadId,
            context: {
              event,
              vars: {},
            } as Prisma.InputJsonValue,
          }),
          select: { id: true },
        });
        await this.queue.enqueueRun({
          runId: run.id,
          tenantId: event.tenantId,
          nodeId: null,
        });
      } catch (err) {
        this.logger.error(
          `dispatch falhou flow=${flow.id} kind=${event.kind}: ${String(err)}`
        );
      }
    }
  }
}

/**
 * Matcher de triggerCfg — um objeto de filtros simples casado contra
 * campos presentes no evento. Chaves desconhecidas são ignoradas.
 * Exemplos:
 *   { origin: "META_ADS" }               // LEAD_CREATED
 *   { textContains: "preço" }            // MESSAGE_RECEIVED
 *   { toStageId: "<uuid>" }              // STAGE_CHANGED
 *   { minScore: 70 }                     // SCORE_THRESHOLD_CROSSED
 */
function matchesCfg(
  cfg: Prisma.JsonValue,
  event: AutomationEvent
): boolean {
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return true;
  const c = cfg as Record<string, unknown>;

  if (event.kind === "LEAD_CREATED") {
    if (typeof c.origin === "string" && c.origin !== event.origin) return false;
  }
  if (event.kind === "MESSAGE_RECEIVED") {
    if (typeof c.textContains === "string") {
      const needle = c.textContains.toLowerCase();
      const hay = (event.text ?? "").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
  }
  if (event.kind === "STAGE_CHANGED") {
    if (typeof c.toStageId === "string" && c.toStageId !== event.toStageId)
      return false;
    if (
      typeof c.fromStageId === "string" &&
      c.fromStageId !== event.fromStageId
    )
      return false;
  }
  if (event.kind === "SCORE_THRESHOLD_CROSSED") {
    if (typeof c.minScore === "number" && event.score < c.minScore) return false;
  }
  return true;
}
