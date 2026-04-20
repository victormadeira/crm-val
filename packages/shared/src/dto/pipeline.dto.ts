import { z } from "zod";
import { PIPELINE_SEGMENTS } from "../enums";

/**
 * requiredFields suporta tanto colunas nativas de Lead (ex. "name", "email")
 * quanto paths em customFields (ex. "customFields.numParticipantes").
 */
export const RequiredFieldSchema = z.object({
  field: z.string().min(1).max(120),
  label: z.string().min(1).max(200),
});
export type RequiredField = z.infer<typeof RequiredFieldSchema>;

export const AutoTaskSchema = z.object({
  title: z.string().min(1).max(300),
  dueInDays: z.number().int().min(0).max(365),
});
export type AutoTask = z.infer<typeof AutoTaskSchema>;

export const CreatePipelineInputSchema = z.object({
  name: z.string().min(1).max(120),
  segment: z.enum(PIPELINE_SEGMENTS),
  color: z.string().max(20).optional(),
  position: z.number().int().min(0).default(0),
});
export type CreatePipelineInput = z.infer<typeof CreatePipelineInputSchema>;

export const UpdatePipelineInputSchema = CreatePipelineInputSchema.partial().omit({
  segment: true,
});
export type UpdatePipelineInput = z.infer<typeof UpdatePipelineInputSchema>;

export const CreatePipelineStageInputSchema = z.object({
  pipelineId: z.string().uuid(),
  name: z.string().min(1).max(120),
  order: z.number().int().min(1).max(50),
  color: z.string().max(20).optional(),
  isFinal: z.boolean().default(false),
  probability: z.number().int().min(0).max(100).default(0),
  rottingDays: z.number().int().min(1).max(365).default(7),
  requiredFields: z.array(RequiredFieldSchema).max(30).default([]),
  autoTasks: z.array(AutoTaskSchema).max(20).default([]),
});
export type CreatePipelineStageInput = z.infer<typeof CreatePipelineStageInputSchema>;

export const UpdatePipelineStageInputSchema = CreatePipelineStageInputSchema.partial().omit({
  pipelineId: true,
});
export type UpdatePipelineStageInput = z.infer<typeof UpdatePipelineStageInputSchema>;

export const MoveLeadInputSchema = z.object({
  stageId: z.string().uuid(),
  /**
   * Se true, o servidor ignora requiredFields faltantes. Usado por supervisores
   * para corrigir pipelines travados. Audita o bypass.
   */
  force: z.boolean().default(false),
});
export type MoveLeadInput = z.infer<typeof MoveLeadInputSchema>;
