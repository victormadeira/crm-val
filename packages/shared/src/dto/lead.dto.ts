import { z } from "zod";
import {
  LEAD_ORIGINS,
  LEAD_STATUSES,
  PIPELINE_SEGMENTS,
  ROTTING_STATUSES,
  PRODUCT_INTERESTS,
  CONSENT_CHANNELS,
  CONSENT_PURPOSES,
} from "../enums";
import { PhoneE164Schema } from "./common.dto";

/**
 * Campos HARD (obrigatórios para qualificar): name, phoneE164, origin.
 * Demais são soft — preenchidos durante o atendimento ou enriquecidos
 * pela IA. Consent é opcional na criação manual; exigido quando a origem
 * é LANDING_PAGE (validado em regra de negócio, não no schema).
 */
export const CreateLeadInputSchema = z.object({
  name: z.string().min(1).max(160),
  phoneE164: PhoneE164Schema,
  origin: z.enum(LEAD_ORIGINS),
  email: z.string().email().max(180).optional(),
  visitDate: z.coerce.date().optional(),
  groupSize: z.number().int().positive().max(500).optional(),
  productInterest: z.enum(PRODUCT_INTERESTS).optional(),
  cityGuess: z.string().max(120).optional(),
  pipelineId: z.string().uuid().optional(),
  segment: z.enum(PIPELINE_SEGMENTS).optional(),
  stageId: z.string().uuid().optional(),
  customFields: z.record(z.unknown()).optional(),
  tagIds: z.array(z.string().uuid()).max(20).optional(),
  sourceCampaign: z.string().max(120).optional(),
  sourceAdset: z.string().max(120).optional(),
  sourceAd: z.string().max(120).optional(),
  sourceFbclid: z.string().max(200).optional(),
  sourceGclid: z.string().max(200).optional(),
  consent: z
    .object({
      policyVersionId: z.string().uuid(),
      purpose: z.enum(CONSENT_PURPOSES),
      channel: z.enum(CONSENT_CHANNELS),
      granted: z.boolean(),
      evidence: z.record(z.unknown()).default({}),
    })
    .optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadInputSchema>;

export const UpdateLeadInputSchema = CreateLeadInputSchema.partial().omit({
  consent: true,
  origin: true,
  phoneE164: true,
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadInputSchema>;

export const LeadListQuerySchema = z.object({
  search: z.string().max(120).optional(),
  pipelineId: z.string().uuid().optional(),
  segment: z.enum(PIPELINE_SEGMENTS).optional(),
  stageId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  rottingStatus: z.enum(ROTTING_STATUSES).optional(),
  ownerId: z.string().uuid().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  origin: z.enum(LEAD_ORIGINS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type LeadListQuery = z.infer<typeof LeadListQuerySchema>;

export const AddLeadNoteInputSchema = z.object({
  body: z.string().min(1).max(4000),
});
export type AddLeadNoteInput = z.infer<typeof AddLeadNoteInputSchema>;

export const ChangeLeadStageInputSchema = z.object({
  stageId: z.string().uuid(),
});
export type ChangeLeadStageInput = z.infer<typeof ChangeLeadStageInputSchema>;

export const AnonymizeLeadInputSchema = z.object({
  reason: z.string().min(3).max(500),
});
export type AnonymizeLeadInput = z.infer<typeof AnonymizeLeadInputSchema>;
