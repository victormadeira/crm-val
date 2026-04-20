import { z } from "zod";
import { LEAD_ORIGINS, PRODUCT_INTERESTS } from "../enums";

/**
 * Campos de destino no CRM — mapeamento "coluna CSV → campo Lead".
 * Mantemos estrita a lista: qualquer coluna não mapeada é descartada.
 */
export const IMPORT_TARGET_FIELDS = [
  "name",
  "phoneE164",
  "email",
  "visitDate",
  "groupSize",
  "productInterest",
  "cityGuess",
  "sourceCampaign",
  "sourceAdset",
  "sourceAd",
  "sourceFbclid",
  "sourceGclid",
  "tagIds",
] as const;
export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export const FieldMapSchema = z.record(z.enum(IMPORT_TARGET_FIELDS).nullable());
export type FieldMap = z.infer<typeof FieldMapSchema>;

/**
 * Upload — payload em JSON (CSV cru na string). Evita dependência de
 * multer pra multipart. RD Station exporta CSV UTF-8 com separador `;`
 * por padrão; o backend detecta entre `,` e `;`.
 */
export const UploadImportSchema = z.object({
  sourceLabel: z.string().min(1).max(120),
  csvContent: z.string().min(1),
  /** Origem que será aplicada aos leads (ex.: IMPORT). */
  origin: z.enum(LEAD_ORIGINS).default("IMPORT"),
});
export type UploadImportInput = z.infer<typeof UploadImportSchema>;

export const ExecuteImportSchema = z.object({
  fieldMap: FieldMapSchema,
  dryRun: z.boolean().default(true),
  /** Tags aplicadas a todos os leads criados. */
  tagIds: z.array(z.string().uuid()).optional(),
  /** Preset estático de productInterest quando a coluna não existir. */
  defaultProductInterest: z.enum(PRODUCT_INTERESTS).optional(),
});
export type ExecuteImportInput = z.infer<typeof ExecuteImportSchema>;
