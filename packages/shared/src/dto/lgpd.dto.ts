import { z } from "zod";
import {
  CONSENT_CHANNELS,
  CONSENT_PURPOSES,
  PRIVACY_REQUEST_KINDS,
} from "../enums";

export const PublishPolicyInputSchema = z.object({
  version: z.string().min(1).max(40),
  body: z.string().min(10).max(200_000),
});
export type PublishPolicyInput = z.infer<typeof PublishPolicyInputSchema>;

export const RecordConsentInputSchema = z.object({
  leadId: z.string().uuid(),
  purpose: z.enum(CONSENT_PURPOSES),
  channel: z.enum(CONSENT_CHANNELS),
  granted: z.boolean(),
  policyVersionId: z.string().uuid(),
  evidence: z.record(z.unknown()).optional(),
});
export type RecordConsentInput = z.infer<typeof RecordConsentInputSchema>;

export const OpenPrivacyRequestInputSchema = z.object({
  requesterEmail: z.string().email().max(180),
  requesterPhone: z.string().max(40).optional(),
  kind: z.enum(PRIVACY_REQUEST_KINDS),
  leadId: z.string().uuid().optional(),
  note: z.string().max(2000).optional(),
});
export type OpenPrivacyRequestInput = z.infer<typeof OpenPrivacyRequestInputSchema>;
