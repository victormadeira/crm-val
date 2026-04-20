import { z } from "zod";

/**
 * Range comum [from, to) — inclusivo no começo, exclusivo no fim.
 * Ausência significa "sem limite"; a API aplica defaults conservadores
 * quando o relatório exige (ex.: visits → últimos 60 dias).
 */
export const ReportRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ReportRangeQuery = z.infer<typeof ReportRangeQuerySchema>;
