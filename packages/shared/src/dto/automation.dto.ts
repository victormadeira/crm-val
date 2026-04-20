import { z } from "zod";
import { AUTOMATION_TRIGGER_KINDS } from "../enums";

/**
 * Estrutura do grafo visual — strict em kind, lenient em config
 * (config varia por kind, validação profunda fica no backend).
 */
export const AutomationNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "send_whatsapp_text",
    "send_whatsapp_template",
    "apply_tag",
    "remove_tag",
    "change_stage",
    "change_status",
    "assign_auto",
    "assign_manual",
    "add_note",
    "wait",
    "set_field",
    "branch",
    "stop",
    "ai_prompt",
    "http_request",
    "set_vars",
  ]),
  config: z.record(z.unknown()).default({}),
  next: z.string().nullable().optional(),
  trueNext: z.string().nullable().optional(),
  falseNext: z.string().nullable().optional(),
});

export const AutomationGraphSchema = z.object({
  startNodeId: z.string().min(1),
  nodes: z.array(AutomationNodeSchema).min(1),
});

export const AutomationFlowStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);

export const CreateAutomationFlowSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  trigger: z.enum(AUTOMATION_TRIGGER_KINDS),
  triggerCfg: z.record(z.unknown()).default({}),
  graph: AutomationGraphSchema,
  status: AutomationFlowStatusSchema.default("DRAFT"),
});
export type CreateAutomationFlowInput = z.infer<
  typeof CreateAutomationFlowSchema
>;

export const UpdateAutomationFlowSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  trigger: z.enum(AUTOMATION_TRIGGER_KINDS).optional(),
  triggerCfg: z.record(z.unknown()).optional(),
  graph: AutomationGraphSchema.optional(),
  status: AutomationFlowStatusSchema.optional(),
});
export type UpdateAutomationFlowInput = z.infer<
  typeof UpdateAutomationFlowSchema
>;

export const AutomationFlowListQuerySchema = z.object({
  status: AutomationFlowStatusSchema.optional(),
  trigger: z.enum(AUTOMATION_TRIGGER_KINDS).optional(),
});
export type AutomationFlowListQuery = z.infer<
  typeof AutomationFlowListQuerySchema
>;
