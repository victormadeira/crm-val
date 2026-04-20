import { z } from "zod";
import { TASK_STATUSES } from "../enums";

export const CreateTaskInputSchema = z.object({
  leadId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).optional(),
  dueAt: z.coerce.date().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(4000).optional(),
  dueAt: z.coerce.date().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

export const TaskListQuerySchema = z.object({
  leadId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  /** "today" | "overdue" | "week" */
  due: z.enum(["today", "overdue", "week"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>;
