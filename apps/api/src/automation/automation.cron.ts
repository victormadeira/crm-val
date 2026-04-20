import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { Prisma } from "@prisma/client";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";
import { AutomationQueue } from "./automation.queue";

const CRON_QUEUE = "automation-cron";
const RECONCILE_EVERY_MS = 60_000;

interface CronJobData {
  flowId: string;
  tenantId: string;
}

/**
 * Scheduler de fluxos com trigger SCHEDULED_CRON. A cada 60s re-escaneia
 * os fluxos ACTIVE e reconcilia a lista de repeatable jobs do BullMQ.
 * Quando um job dispara, cria AutomationRun e enfileira o tick inicial.
 *
 * Por que reconcile e não hook em create/update: (1) evita acoplar
 * AutomationService ao BullMQ, (2) garante que qualquer divergência
 * (ex.: job órfão após crash) é corrigida em ≤60s.
 */
@Injectable()
export class AutomationCronService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(AutomationCronService.name);
  private conn!: IORedis;
  private queue!: Queue<CronJobData>;
  private worker!: Worker<CronJobData>;
  private reconcileTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(ENV_TOKEN) private readonly env: Env,
    private readonly prisma: PrismaService,
    private readonly runQueue: AutomationQueue
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.conn = new IORedis(this.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<CronJobData>(CRON_QUEUE, {
      connection: this.conn,
      defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 },
    });
    this.worker = new Worker<CronJobData>(
      CRON_QUEUE,
      async (job) => {
        await this.tick(job.data);
      },
      { connection: this.conn.duplicate(), concurrency: 5 }
    );

    try {
      await this.reconcile();
    } catch (err) {
      this.logger.error(`reconcile inicial falhou: ${String(err)}`);
    }
    this.reconcileTimer = setInterval(() => {
      this.reconcile().catch((err) =>
        this.logger.error(`reconcile falhou: ${String(err)}`)
      );
    }, RECONCILE_EVERY_MS);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.reconcileTimer) clearInterval(this.reconcileTimer);
    await this.worker?.close();
    await this.queue?.close();
    await this.conn?.quit();
  }

  /**
   * Scan cross-tenant dos flows SCHEDULED_CRON ativos e reconcilia
   * os repeatable jobs do BullMQ. Remove órfãos, adiciona novos,
   * recria quando o cron expression mudou.
   */
  private async reconcile(): Promise<void> {
    const flows = await TenantContext.runOutsideTenant(async () =>
      (this.prisma as PrismaService & {
        automationFlow: PrismaService["scoped"]["automationFlow"];
      }).automationFlow.findMany({
        where: { trigger: "SCHEDULED_CRON", status: "ACTIVE" },
        select: { id: true, tenantId: true, triggerCfg: true },
      })
    );

    // Chave estável p/ o job → cron string. Se mudar, removemos e recriamos.
    const desired = new Map<string, { data: CronJobData; cron: string }>();
    for (const f of flows) {
      const cfg = f.triggerCfg as Prisma.JsonObject | null;
      const cron = cfg && typeof cfg.cron === "string" ? cfg.cron : null;
      if (!cron) continue;
      desired.set(`flow-${f.id}`, {
        data: { flowId: f.id, tenantId: f.tenantId },
        cron,
      });
    }

    const existing = await this.queue.getRepeatableJobs();
    const existingByName = new Map(existing.map((e) => [e.name, e]));

    // Remove órfãos ou com cron divergente.
    for (const e of existing) {
      const want = desired.get(e.name);
      if (!want || want.cron !== e.pattern) {
        await this.queue.removeRepeatableByKey(e.key);
      }
    }

    // Adiciona faltantes.
    for (const [name, { data, cron }] of desired.entries()) {
      const prev = existingByName.get(name);
      if (prev && prev.pattern === cron) continue;
      await this.queue.add(name, data, {
        repeat: { pattern: cron, tz: "America/Sao_Paulo" },
        jobId: name,
      });
    }
  }

  /** Dispara UM run do flow — chamado quando o cron bate. */
  private async tick(data: CronJobData): Promise<void> {
    await TenantContext.run(
      { tenantId: data.tenantId, userId: "__cron__" },
      async () => {
        const flow = await this.prisma.scoped.automationFlow.findUnique({
          where: { id: data.flowId },
          select: { id: true, status: true, triggerCfg: true },
        });
        if (!flow || flow.status !== "ACTIVE") return;

        const run = await this.prisma.scoped.automationRun.create({
          data: scopedData({
            flowId: data.flowId,
            leadId: null,
            context: {
              event: {
                kind: "SCHEDULED_CRON_FIRED",
                tenantId: data.tenantId,
                triggerCfg: flow.triggerCfg,
                firedAt: new Date().toISOString(),
              },
              vars: {},
            } as Prisma.InputJsonValue,
          }),
          select: { id: true },
        });

        await this.runQueue.enqueueRun({
          runId: run.id,
          tenantId: data.tenantId,
          nodeId: null,
        });
      }
    );
  }
}
