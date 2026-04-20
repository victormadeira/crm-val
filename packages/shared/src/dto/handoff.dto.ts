import { z } from "zod";
import { PIPELINE_SEGMENTS } from "../enums";
import { PhoneE164Schema } from "./common.dto";

/**
 * Handoff agente IA → vendedor humano. Chamado pelo bot (ou n8n/Claude agent)
 * quando detecta critério de qualificação real (tipo de grupo definido, data
 * mencionada, participantes). Cria lead pronto no pipeline certo.
 */
export const HandoffInputSchema = z.object({
  phone: PhoneE164Schema,
  clientName: z.string().min(1).max(160),
  segment: z.enum(PIPELINE_SEGMENTS),
  numParticipants: z.number().int().positive().max(5000).optional(),
  eventDate: z.coerce.date().optional(),
  groupType: z.string().max(120).optional(),
  budgetRange: z.string().max(120).optional(),
  chatSummary: z.string().max(4000),
  agentSessionId: z.string().max(200),
  customFields: z.record(z.unknown()).optional(),
});
export type HandoffInput = z.infer<typeof HandoffInputSchema>;
