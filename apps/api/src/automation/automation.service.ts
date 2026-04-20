import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  AutomationFlowListQuery,
  CreateAutomationFlowInput,
  UpdateAutomationFlowInput,
} from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import type { AuthContext } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import type { AutomationGraph, AutomationNode } from "./automation.types";

/**
 * CRUD dos AutomationFlows. Valida estrutura do graph antes de gravar:
 *   - todos os nós têm kind/config compatível
 *   - cada `next/trueNext/falseNext` aponta pra um id existente
 *   - existe startNodeId
 *
 * Cross-tenant impossível por construção — tudo passa por scoped.
 */
@Injectable()
export class AutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async list(q: AutomationFlowListQuery) {
    return this.prisma.scoped.automationFlow.findMany({
      where: {
        ...(q.status && { status: q.status }),
        ...(q.trigger && { trigger: q.trigger }),
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async get(id: string) {
    const flow = await this.prisma.scoped.automationFlow.findUnique({
      where: { id },
    });
    if (!flow) throw new NotFoundException("Fluxo não encontrado");
    return flow;
  }

  async create(input: CreateAutomationFlowInput, auth: AuthContext) {
    validateGraph(input.graph as AutomationGraph);
    const flow = await this.prisma.scoped.automationFlow.create({
      data: scopedData({
        name: input.name,
        description: input.description ?? null,
        trigger: input.trigger,
        triggerCfg: input.triggerCfg as Prisma.InputJsonValue,
        graph: input.graph as unknown as Prisma.InputJsonValue,
        status: input.status,
      }),
    });
    await this.audit.record({
      action: "automation.create",
      entity: "AutomationFlow",
      entityId: flow.id,
      metadata: { by: auth.userId, trigger: input.trigger },
    });
    return flow;
  }

  async update(
    id: string,
    patch: UpdateAutomationFlowInput,
    auth: AuthContext
  ) {
    if (patch.graph) validateGraph(patch.graph as AutomationGraph);
    const data: Prisma.AutomationFlowUpdateInput = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.description !== undefined)
      data.description = patch.description ?? null;
    if (patch.trigger !== undefined) data.trigger = patch.trigger;
    if (patch.triggerCfg !== undefined)
      data.triggerCfg = patch.triggerCfg as Prisma.InputJsonValue;
    if (patch.graph !== undefined)
      data.graph = patch.graph as unknown as Prisma.InputJsonValue;
    if (patch.status !== undefined) data.status = patch.status;

    let flow;
    try {
      flow = await this.prisma.scoped.automationFlow.update({
        where: { id },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw new NotFoundException("Fluxo não encontrado");
      }
      throw e;
    }
    await this.audit.record({
      action: "automation.update",
      entity: "AutomationFlow",
      entityId: id,
      metadata: { by: auth.userId, fields: Object.keys(data) },
    });
    return flow;
  }

  async remove(id: string, auth: AuthContext) {
    try {
      await this.prisma.scoped.automationFlow.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw new NotFoundException("Fluxo não encontrado");
      }
      throw e;
    }
    await this.audit.record({
      action: "automation.delete",
      entity: "AutomationFlow",
      entityId: id,
      metadata: { by: auth.userId },
    });
  }

  async listRuns(flowId: string, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    return this.prisma.scoped.automationRun.findMany({
      where: { flowId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        status: true,
        leadId: true,
        attempts: true,
        lastError: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
      },
    });
  }

  async getRun(flowId: string, runId: string) {
    const run = await this.prisma.scoped.automationRun.findFirst({
      where: { id: runId, flowId },
      include: {
        steps: { orderBy: { startedAt: "asc" } },
      },
    });
    if (!run) throw new NotFoundException("Execução não encontrada");
    return run;
  }
}

function validateGraph(graph: AutomationGraph): void {
  if (!graph || !graph.startNodeId) {
    throw new BadRequestException("graph.startNodeId ausente");
  }
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (ids.size !== graph.nodes.length) {
    throw new BadRequestException("graph.nodes com ids duplicados");
  }
  if (!ids.has(graph.startNodeId)) {
    throw new BadRequestException("startNodeId não pertence a graph.nodes");
  }
  for (const node of graph.nodes as AutomationNode[]) {
    if (node.kind === "branch") {
      if (node.trueNext && !ids.has(node.trueNext)) {
        throw new BadRequestException(
          `node ${node.id}: trueNext "${node.trueNext}" inexistente`
        );
      }
      if (node.falseNext && !ids.has(node.falseNext)) {
        throw new BadRequestException(
          `node ${node.id}: falseNext "${node.falseNext}" inexistente`
        );
      }
    } else if (node.next && !ids.has(node.next)) {
      throw new BadRequestException(
        `node ${node.id}: next "${node.next}" inexistente`
      );
    }
  }
}
