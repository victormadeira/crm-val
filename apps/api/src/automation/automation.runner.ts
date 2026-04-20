import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AutomationActions } from "./automation.actions";
import {
  AUTOMATION_RUN_QUEUE,
  AutomationQueue,
  type AutomationRunJob,
} from "./automation.queue";
import type {
  AutomationGraph,
  AutomationNode,
  AutomationRunContext,
} from "./automation.types";

/**
 * Executa UM nó do fluxo. Cada tick do runner = 1 job na BullMQ:
 *   - Carrega o AutomationRun e o AutomationFlow.
 *   - Resolve o node atual (nodeId === null → startNodeId).
 *   - Executa via AutomationActions.
 *   - Grava AutomationRunStep.
 *   - Enfileira o próximo (com delay em caso de wait), ou finaliza.
 *
 * Falha de um nó: grava step FAILED e re-lança, para a BullMQ fazer
 * backoff nas `attempts` restantes. Quando esgotar → marca run FAILED.
 */
@Injectable()
export class AutomationRunner {
  private readonly logger = new Logger(AutomationRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly actions: AutomationActions,
    private readonly queue: AutomationQueue
  ) {}

  async tick(job: AutomationRunJob, attemptsMade: number): Promise<void> {
    const run = await this.prisma.scoped.automationRun.findUnique({
      where: { id: job.runId },
      select: {
        id: true,
        status: true,
        flowId: true,
        leadId: true,
        context: true,
      },
    });
    if (!run) {
      this.logger.warn(`run ${job.runId} sumiu`);
      return;
    }
    if (run.status === "CANCELLED" || run.status === "SUCCEEDED") return;

    const flow = await this.prisma.scoped.automationFlow.findUnique({
      where: { id: run.flowId },
      select: { id: true, graph: true, status: true },
    });
    if (!flow || flow.status !== "ACTIVE") {
      await this.prisma.scoped.automationRun.update({
        where: { id: run.id },
        data: {
          status: "CANCELLED",
          finishedAt: new Date(),
          lastError: "Flow inativo ou removido",
        },
      });
      return;
    }

    const graph = flow.graph as unknown as AutomationGraph;
    const nodeId = job.nodeId ?? graph.startNodeId;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) {
      await this.prisma.scoped.automationRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          lastError: `node ${nodeId} não encontrado no graph`,
        },
      });
      return;
    }

    if (run.status === "PENDING") {
      await this.prisma.scoped.automationRun.update({
        where: { id: run.id },
        data: { status: "RUNNING", startedAt: new Date() },
      });
    }

    const ctx = run.context as unknown as AutomationRunContext;
    const startedAt = new Date();

    try {
      const result = await this.actions.execute(node, ctx);
      await this.prisma.scoped.automationRunStep.create({
        data: {
          runId: run.id,
          nodeId: node.id,
          kind: node.kind,
          status: "SUCCEEDED",
          input: snapshotInput(node),
          output: (result.output ?? {}) as Prisma.InputJsonValue,
          startedAt,
          endedAt: new Date(),
        },
      });

      // Persiste ctx (vars acumulados por ai_prompt/http_request/set_vars)
      // pra que o próximo tick releia o estado atualizado.
      await this.prisma.scoped.automationRun.update({
        where: { id: run.id },
        data: { context: ctx as unknown as Prisma.InputJsonValue },
      });

      if (result.nextNodeId) {
        await this.queue.enqueueRun(
          {
            runId: run.id,
            tenantId: job.tenantId,
            nodeId: result.nextNodeId,
          },
          result.delayMs
        );
      } else {
        await this.prisma.scoped.automationRun.update({
          where: { id: run.id },
          data: { status: "SUCCEEDED", finishedAt: new Date() },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.prisma.scoped.automationRunStep.create({
        data: {
          runId: run.id,
          nodeId: node.id,
          kind: node.kind,
          status: "FAILED",
          input: snapshotInput(node),
          error: msg,
          startedAt,
          endedAt: new Date(),
        },
      });

      // attemptsMade é 1-based quando vem do BullMQ (primeira tentativa = 1).
      // Se esgotou, marcamos run como FAILED; senão a queue refaz backoff.
      const willRetry = attemptsMade < MAX_ATTEMPTS_PER_NODE;
      await this.prisma.scoped.automationRun.update({
        where: { id: run.id },
        data: {
          attempts: { increment: 1 },
          lastError: msg,
          status: willRetry ? "RUNNING" : "FAILED",
          finishedAt: willRetry ? null : new Date(),
        },
      });
      if (!willRetry) {
        this.logger.error(
          `run ${run.id} FAILED em node=${node.id} após ${attemptsMade} tentativas: ${msg}`
        );
        return;
      }
      throw err;
    }
  }
}

/** Deve casar com o `attempts` de AUTOMATION_RUN_QUEUE. */
export const MAX_ATTEMPTS_PER_NODE = 5;

function snapshotInput(node: AutomationNode): Prisma.InputJsonValue {
  // Elimina campos "next/trueNext/falseNext" — ruído pra debug do step.
  const { id, kind } = node;
  const config =
    "config" in node ? (node.config as unknown as Prisma.InputJsonValue) : {};
  return { id, kind, config } as Prisma.InputJsonValue;
}

// Export AUTOMATION_RUN_QUEUE re-export p/ testes ou consumers externos.
export { AUTOMATION_RUN_QUEUE };
