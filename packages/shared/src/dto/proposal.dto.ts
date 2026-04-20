import { z } from "zod";
import { PROPOSAL_STATUSES } from "../enums";

export const CreateProposalInputSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(1).max(240),
  valueCents: z.number().int().min(0).max(1_000_000_000),
  validUntil: z.coerce.date().optional(),
  content: z.record(z.unknown()).default({}),
});
export type CreateProposalInput = z.infer<typeof CreateProposalInputSchema>;

export const UpdateProposalInputSchema = z.object({
  title: z.string().min(1).max(240).optional(),
  valueCents: z.number().int().min(0).optional(),
  validUntil: z.coerce.date().optional().nullable(),
  content: z.record(z.unknown()).optional(),
  status: z.enum(PROPOSAL_STATUSES).optional(),
});
export type UpdateProposalInput = z.infer<typeof UpdateProposalInputSchema>;
