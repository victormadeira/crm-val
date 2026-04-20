import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreateTaskInput,
  TaskListQuery,
  UpdateTaskInput,
} from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { RottingService } from "../rotting/rotting.service";
import type { AuthContext } from "../auth/auth.types";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rotting: RottingService
  ) {}

  async create(input: CreateTaskInput, auth: AuthContext) {
    const task = await this.prisma.scoped.task.create({
      data: scopedData({
        leadId: input.leadId ?? null,
        assigneeId: input.assigneeId ?? auth.userId,
        title: input.title,
        description: input.description ?? null,
        dueAt: input.dueAt ?? null,
        status: "PENDING",
      }),
      select: { id: true },
    });

    if (input.leadId) {
      await this.prisma.scoped.leadEvent.create({
        data: {
          leadId: input.leadId,
          kind: "TASK_CREATED",
          actorId: auth.userId,
          payload: { taskId: task.id, title: input.title } as Prisma.InputJsonValue,
        },
      });
      await this.rotting.markActivity(input.leadId);
    }

    await this.audit.record({
      action: "task.create",
      entity: "Task",
      entityId: task.id,
      metadata: { leadId: input.leadId ?? null },
    });

    return task;
  }

  async list(q: TaskListQuery) {
    const where: Prisma.TaskWhereInput = {
      ...(q.leadId && { leadId: q.leadId }),
      ...(q.assigneeId && { assigneeId: q.assigneeId }),
      ...(q.status && { status: q.status }),
    };

    if (q.due) {
      const now = new Date();
      const startToday = new Date(now);
      startToday.setHours(0, 0, 0, 0);
      const endToday = new Date(now);
      endToday.setHours(23, 59, 59, 999);

      if (q.due === "today") {
        where.dueAt = { gte: startToday, lte: endToday };
        where.status = where.status ?? "PENDING";
      } else if (q.due === "overdue") {
        where.dueAt = { lt: startToday };
        where.status = where.status ?? "PENDING";
      } else if (q.due === "week") {
        const endWeek = new Date(startToday);
        endWeek.setDate(endWeek.getDate() + 7);
        where.dueAt = { gte: startToday, lte: endWeek };
        where.status = where.status ?? "PENDING";
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.scoped.task.findMany({
        where,
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          lead: { select: { id: true, name: true, phoneE164: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),
      this.prisma.scoped.task.count({ where }),
    ]);

    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async getById(id: string) {
    const task = await this.prisma.scoped.task.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, phoneE164: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    if (!task) throw new NotFoundException("Task não encontrada");
    return task;
  }

  async update(id: string, patch: UpdateTaskInput, auth: AuthContext) {
    const existing = await this.prisma.scoped.task.findUnique({
      where: { id },
      select: { id: true, leadId: true, status: true },
    });
    if (!existing) throw new NotFoundException("Task não encontrada");

    const data: Prisma.TaskUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.dueAt !== undefined) data.dueAt = patch.dueAt;
    if (patch.assigneeId !== undefined) {
      data.assignee = patch.assigneeId
        ? { connect: { id: patch.assigneeId } }
        : { disconnect: true };
    }
    if (patch.status !== undefined) {
      data.status = patch.status;
      if (patch.status === "COMPLETED" && existing.status !== "COMPLETED") {
        data.completedAt = new Date();
      }
      if (patch.status !== "COMPLETED") {
        data.completedAt = null;
      }
    }

    await this.prisma.scoped.task.update({ where: { id }, data });

    if (
      patch.status === "COMPLETED" &&
      existing.status !== "COMPLETED" &&
      existing.leadId
    ) {
      await this.prisma.scoped.leadEvent.create({
        data: {
          leadId: existing.leadId,
          kind: "TASK_COMPLETED",
          actorId: auth.userId,
          payload: { taskId: id } as Prisma.InputJsonValue,
        },
      });
      await this.rotting.markActivity(existing.leadId);
    }

    await this.audit.record({
      action: "task.update",
      entity: "Task",
      entityId: id,
      metadata: { fields: Object.keys(patch) },
    });
  }

  async remove(id: string, auth: AuthContext): Promise<void> {
    const existing = await this.prisma.scoped.task.findUnique({
      where: { id },
      select: { id: true, createdByRule: true },
    });
    if (!existing) throw new NotFoundException("Task não encontrada");
    if (existing.createdByRule?.startsWith("stage_entry:")) {
      throw new BadRequestException(
        "Tasks automáticas de estágio não podem ser deletadas — mude o status pra CANCELLED"
      );
    }
    await this.prisma.scoped.task.delete({ where: { id } });
    await this.audit.record({
      action: "task.delete",
      entity: "Task",
      entityId: id,
      metadata: { actorId: auth.userId },
    });
  }
}
