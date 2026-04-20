import { z } from "zod";
import { LEAD_ORIGINS } from "../enums";

export const LandingPageStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "PAUSED",
  "ARCHIVED",
]);

/**
 * `document` é o JSON produzido pelo builder visual (apps/web).
 * Não validamos shape detalhado aqui — frontend é dono dessa árvore.
 */
export const CreateLandingPageSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug deve ser kebab-case"),
  title: z.string().min(1).max(200),
  template: z.string().min(1).max(80),
  document: z.record(z.unknown()).default({}),
  metaPixelId: z.string().max(40).optional(),
  gaId: z.string().max(40).optional(),
  clarityId: z.string().max(40).optional(),
  status: LandingPageStatusSchema.default("DRAFT"),
});
export type CreateLandingPageInput = z.infer<typeof CreateLandingPageSchema>;

export const UpdateLandingPageSchema = CreateLandingPageSchema.partial();
export type UpdateLandingPageInput = z.infer<typeof UpdateLandingPageSchema>;

/**
 * Submissão pública. O front-end da landing envia os campos definidos
 * no `document`; o backend mapeia name + phoneE164 obrigatórios; o resto
 * vai em `payload` pra consulta futura.
 */
export const LandingSubmissionSchema = z.object({
  name: z.string().min(1).max(200),
  phoneE164: z.string().min(6).max(20),
  email: z.string().email().optional(),
  payload: z.record(z.unknown()).default({}),
  consent: z
    .object({
      purpose: z.enum(["MARKETING", "TRANSACTIONAL", "ANALYTICS", "WHATSAPP"]),
      granted: z.boolean().default(true),
      policyVersionId: z.string().uuid(),
    })
    .optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  fbclid: z.string().max(160).optional(),
  gclid: z.string().max(160).optional(),
  origin: z.enum(LEAD_ORIGINS).default("LANDING_PAGE"),
});
export type LandingSubmissionInput = z.infer<typeof LandingSubmissionSchema>;
