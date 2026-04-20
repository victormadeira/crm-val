import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreatePipelineInput,
  UpdatePipelineInput,
  CreatePipelineStageInput,
  UpdatePipelineStageInput,
} from "@valparaiso/shared";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";

/**
 * CRUD de Pipeline + PipelineStage. Pipeline é único por (tenantId, segment) —
 * só pode existir UM funil de "Grupos Escolares" por tenant. PipelineStage é
 * único por (pipelineId, name).
 */
@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.scoped.pipeline.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: {
        stages: { orderBy: { order: "asc" } },
      },
    });
  }

  async getById(id: string) {
    const p = await this.prisma.scoped.pipeline.findUnique({
      where: { id },
      include: { stages: { orderBy: { order: "asc" } } },
    });
    if (!p) throw new NotFoundException("Pipeline não encontrado");
    return p;
  }

  async create(input: CreatePipelineInput) {
    try {
      return await this.prisma.scoped.pipeline.create({
        data: scopedData({
          name: input.name,
          segment: input.segment,
          color: input.color ?? null,
          position: input.position,
          isDefault: false,
        }),
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(
          "Já existe um pipeline para este segmento neste tenant"
        );
      }
      throw e;
    }
  }

  async update(id: string, patch: UpdatePipelineInput) {
    const data: Record<string, unknown> = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.color !== undefined) data.color = patch.color;
    if (patch.position !== undefined) data.position = patch.position;
    await this.prisma.scoped.pipeline.update({ where: { id }, data });
    return this.getById(id);
  }

  async remove(id: string) {
    await this.prisma.scoped.pipeline.delete({ where: { id } });
  }

  async createStage(input: CreatePipelineStageInput) {
    const pipeline = await this.prisma.scoped.pipeline.findUnique({
      where: { id: input.pipelineId },
      select: { id: true },
    });
    if (!pipeline) throw new NotFoundException("Pipeline não encontrado");

    try {
      return await this.prisma.scoped.pipelineStage.create({
        data: scopedData({
          pipelineId: input.pipelineId,
          name: input.name,
          order: input.order,
          color: input.color ?? null,
          isFinal: input.isFinal,
          probability: input.probability,
          rottingDays: input.rottingDays,
          requiredFields: input.requiredFields as unknown as Prisma.InputJsonValue,
          autoTasks: input.autoTasks as unknown as Prisma.InputJsonValue,
        }),
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Já existe estágio com esse nome no pipeline");
      }
      throw e;
    }
  }

  async updateStage(id: string, patch: UpdatePipelineStageInput) {
    const data: Record<string, unknown> = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.order !== undefined) data.order = patch.order;
    if (patch.color !== undefined) data.color = patch.color;
    if (patch.isFinal !== undefined) data.isFinal = patch.isFinal;
    if (patch.probability !== undefined) data.probability = patch.probability;
    if (patch.rottingDays !== undefined) data.rottingDays = patch.rottingDays;
    if (patch.requiredFields !== undefined) {
      data.requiredFields = patch.requiredFields as unknown as Prisma.InputJsonValue;
    }
    if (patch.autoTasks !== undefined) {
      data.autoTasks = patch.autoTasks as unknown as Prisma.InputJsonValue;
    }
    await this.prisma.scoped.pipelineStage.update({ where: { id }, data });
    return this.prisma.scoped.pipelineStage.findUnique({ where: { id } });
  }

  async removeStage(id: string) {
    await this.prisma.scoped.pipelineStage.delete({ where: { id } });
  }
}
