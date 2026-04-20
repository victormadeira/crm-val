import { z } from "zod";
import { ASSIGNMENT_REASONS } from "../enums";

export const ManualAssignInputSchema = z.object({
  leadId: z.string().uuid(),
  assignedToId: z.string().uuid(),
  reason: z.enum(ASSIGNMENT_REASONS).optional(),
});
export type ManualAssignInput = z.infer<typeof ManualAssignInputSchema>;

export const AutoAssignInputSchema = z.object({
  reason: z.enum(ASSIGNMENT_REASONS).optional(),
  aiScore: z.number().min(0).max(100).optional(),
});
export type AutoAssignInput = z.infer<typeof AutoAssignInputSchema>;
