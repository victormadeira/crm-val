import { z } from "zod";
import { PhoneE164Schema } from "./common.dto";

export const SendTextMessageInputSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().min(1).max(4096),
});
export type SendTextMessageInput = z.infer<typeof SendTextMessageInputSchema>;

export const SendTemplateMessageInputSchema = z.object({
  leadId: z.string().uuid(),
  templateName: z.string().min(1).max(120),
  languageCode: z.string().min(2).max(10),
  components: z.array(z.record(z.unknown())).optional(),
});
export type SendTemplateMessageInput = z.infer<typeof SendTemplateMessageInputSchema>;

export const SendMediaMessageInputSchema = z.object({
  leadId: z.string().uuid(),
  kind: z.enum(["IMAGE", "AUDIO", "VIDEO", "DOCUMENT"]),
  mediaUrl: z.string().url(),
  caption: z.string().max(1024).optional(),
  filename: z.string().max(255).optional(),
});
export type SendMediaMessageInput = z.infer<typeof SendMediaMessageInputSchema>;

/**
 * Payload da página de configuração do WABA no CRM. O accessToken
 * viaja em HTTPS uma única vez e é criptografado com a chave do tenant
 * no backend (nunca volta pro front em claro).
 */
export const UpsertWaAccountInputSchema = z.object({
  wabaId: z.string().min(1),
  businessId: z.string().optional(),
  accessToken: z.string().min(20),
  appSecret: z.string().min(8),
  verifyToken: z.string().min(8),
  phoneNumbers: z
    .array(
      z.object({
        phoneNumberId: z.string().min(1),
        displayPhoneE164: PhoneE164Schema,
        verifiedName: z.string().optional(),
        default: z.boolean().optional(),
      })
    )
    .min(1),
});
export type UpsertWaAccountInput = z.infer<typeof UpsertWaAccountInputSchema>;
