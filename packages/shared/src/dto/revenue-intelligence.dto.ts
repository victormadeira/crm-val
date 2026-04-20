import { z } from "zod";

export const WEATHER_CATEGORIES = [
  "EXCELENTE",
  "BOM",
  "REGULAR",
  "RUIM",
  "PESSIMO",
] as const;
export type WeatherCategoryDto = (typeof WEATHER_CATEGORIES)[number];

export const DAY_TYPES = [
  "FIM_DE_SEMANA",
  "FERIADO",
  "DIA_UTIL",
  "EVENTO_ESPECIAL",
] as const;
export type DayTypeDto = (typeof DAY_TYPES)[number];

export const RAIN_INTENSITIES = [
  "NENHUMA",
  "LEVE",
  "MODERADA",
  "FORTE",
] as const;

export const PRICING_PRODUCTS = [
  "INGRESSO_AVULSO",
  "PASSAPORTE_DIA",
  "PASSAPORTE_MENSAL",
  "PASSAPORTE_ANUAL",
  "GRUPO_ESCOLAR",
  "GRUPO_CORPORATIVO",
] as const;
export type PricingProductDto = (typeof PRICING_PRODUCTS)[number];

export const INSIGHT_TYPES = [
  "OPORTUNIDADE",
  "RISCO",
  "ACAO",
  "SAZONALIDADE",
] as const;

export const INSIGHT_PRIORITIES = ["ALTA", "MEDIA", "BAIXA"] as const;

/* ────────── Actuals (entrada manual / CSV) ────────── */

export const RevenueActualInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve ser YYYY-MM-DD"),
  grossRevenueCents: z.number().int().nonnegative(),
  visitorCount: z.number().int().nonnegative().optional(),
  capacityPct: z.number().min(0).max(100).optional(),
  capacityTotal: z.number().int().positive().optional(),
  tempMaxActual: z.number().optional(),
  hadRain: z.boolean().optional(),
  rainIntensity: z.enum(RAIN_INTENSITIES).optional(),
  dayType: z.enum(DAY_TYPES),
  promotionsActive: z.array(z.string()).default([]),
  groupsCount: z.number().int().nonnegative().optional(),
  groupsRevenueCents: z.number().int().nonnegative().optional(),
  avulsoRevenueCents: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});
export type RevenueActualInput = z.infer<typeof RevenueActualInputSchema>;

export const RevenueActualPatchSchema = RevenueActualInputSchema.partial().omit(
  { date: true }
);
export type RevenueActualPatch = z.infer<typeof RevenueActualPatchSchema>;

/* ────────── CSV Import ────────── */

export const RevenueCsvImportSchema = z.object({
  csv: z.string().min(10),
  dryRun: z.boolean().default(true),
  overwrite: z.boolean().default(false),
});
export type RevenueCsvImport = z.infer<typeof RevenueCsvImportSchema>;

/* ────────── Pricing Config ────────── */

export const PricingConfigUpdateSchema = z.object({
  basePriceCents: z.number().int().positive().optional(),
  minPriceCents: z.number().int().nonnegative().nullable().optional(),
  maxPriceCents: z.number().int().positive().nullable().optional(),
  multExcelente: z.number().min(0.1).max(3).optional(),
  multBom: z.number().min(0.1).max(3).optional(),
  multRegular: z.number().min(0.1).max(3).optional(),
  multRuim: z.number().min(0.1).max(3).optional(),
  multPessimo: z.number().min(0.1).max(3).optional(),
  isActive: z.boolean().optional(),
});
export type PricingConfigUpdate = z.infer<typeof PricingConfigUpdateSchema>;

/* ────────── Queries ────────── */

export const ForecastQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(16).default(16),
});
export type ForecastQuery = z.infer<typeof ForecastQuerySchema>;

export const DateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/* ────────── Insight feedback ────────── */

export const InsightFeedbackSchema = z.object({
  actionTaken: z.enum(["ACEITOU", "IGNOROU"]),
  actualOutcomeCents: z.number().int().nonnegative().optional(),
});
export type InsightFeedback = z.infer<typeof InsightFeedbackSchema>;
