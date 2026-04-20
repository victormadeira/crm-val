/**
 * Enums espelhados do Prisma schema (apps/api/prisma/schema.prisma).
 * Mantidos aqui para o front-end e clientes não precisarem importar
 * @prisma/client. Quando algo mudar no schema, atualize aqui também.
 */

export const USER_ROLES = [
  "ADMIN",
  "SUPERVISOR",
  "ATTENDANT",
  "MARKETING",
  "FINANCE",
  "PARK_MANAGER",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LEAD_ORIGINS = [
  "META_ADS",
  "GOOGLE_ADS",
  "ORGANIC",
  "REFERRAL",
  "WALK_IN",
  "LANDING_PAGE",
  "IMPORT",
  "MANUAL",
  "OTHER",
] as const;
export type LeadOrigin = (typeof LEAD_ORIGINS)[number];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "NEGOTIATING",
  "WON",
  "LOST",
  "ARCHIVED",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PRODUCT_INTERESTS = [
  "DAILY_PASS",
  "ANNUAL_PASS",
  "BIRTHDAY_PARTY",
  "CORPORATE_EVENT",
  "RADICAL_ADVENTURE",
  "PROMOTION",
  "OTHER",
] as const;
export type ProductInterest = (typeof PRODUCT_INTERESTS)[number];

export const LEAD_EVENT_KINDS = [
  "CREATED",
  "STAGE_CHANGED",
  "PIPELINE_CHANGED",
  "STATUS_CHANGED",
  "ASSIGNED",
  "UNASSIGNED",
  "TAG_ADDED",
  "TAG_REMOVED",
  "MESSAGE_IN",
  "MESSAGE_OUT",
  "NOTE_ADDED",
  "SCORE_UPDATED",
  "ROTTING_CHANGED",
  "TASK_CREATED",
  "TASK_COMPLETED",
  "PROPOSAL_SENT",
  "PROPOSAL_OPENED",
  "BOOKING_CREATED",
  "FIELD_UPDATED",
  "CONSENT_GIVEN",
  "CONSENT_REVOKED",
  "ANONYMIZED",
] as const;
export type LeadEventKind = (typeof LEAD_EVENT_KINDS)[number];

export const PIPELINE_SEGMENTS = [
  "GRUPOS_ESCOLARES",
  "EVENTOS_CORPORATIVOS",
  "PACOTES_CONVENIOS",
  "AVULSO",
] as const;
export type PipelineSegment = (typeof PIPELINE_SEGMENTS)[number];

export const ROTTING_STATUSES = ["HEALTHY", "WARNING", "ROTTEN"] as const;
export type RottingStatus = (typeof ROTTING_STATUSES)[number];

export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BOOKING_STATUSES = ["TENTATIVE", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "OPENED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const ASSIGNMENT_REASONS = [
  "AI_SUGGESTION",
  "ROUND_ROBIN",
  "MANUAL_SUPERVISOR",
  "MANUAL_SELF_CLAIM",
  "REASSIGNED",
] as const;
export type AssignmentReason = (typeof ASSIGNMENT_REASONS)[number];

export const CONSENT_PURPOSES = [
  "MARKETING",
  "TRANSACTIONAL",
  "ANALYTICS",
  "WHATSAPP",
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const CONSENT_CHANNELS = [
  "LANDING_PAGE",
  "WHATSAPP",
  "PHONE",
  "IN_PERSON",
  "IMPORT",
] as const;
export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

export const WA_MESSAGE_KINDS = [
  "TEXT",
  "IMAGE",
  "AUDIO",
  "VIDEO",
  "DOCUMENT",
  "LOCATION",
  "TEMPLATE",
  "INTERACTIVE",
  "STICKER",
  "REACTION",
  "SYSTEM",
] as const;
export type WaMessageKind = (typeof WA_MESSAGE_KINDS)[number];

export const WA_MESSAGE_STATUSES = [
  "PENDING",
  "SENT",
  "DELIVERED",
  "READ",
  "FAILED",
  "RECEIVED",
] as const;
export type WaMessageStatus = (typeof WA_MESSAGE_STATUSES)[number];

export const WA_TEMPLATE_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PAUSED",
  "DISABLED",
] as const;
export type WaTemplateStatus = (typeof WA_TEMPLATE_STATUSES)[number];

export const AUTOMATION_TRIGGER_KINDS = [
  "LEAD_CREATED",
  "MESSAGE_RECEIVED",
  "NO_REPLY_TIMEOUT",
  "TAG_APPLIED",
  "STAGE_CHANGED",
  "SCORE_THRESHOLD_CROSSED",
  "SCHEDULED_CRON",
] as const;
export type AutomationTriggerKind = (typeof AUTOMATION_TRIGGER_KINDS)[number];

export const PRIVACY_REQUEST_KINDS = [
  "ACCESS",
  "EXPORT",
  "DELETION",
  "RECTIFICATION",
] as const;
export type PrivacyRequestKind = (typeof PRIVACY_REQUEST_KINDS)[number];

export const PRIVACY_REQUEST_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
] as const;
export type PrivacyRequestStatus = (typeof PRIVACY_REQUEST_STATUSES)[number];
