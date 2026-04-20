import { z } from "zod";

export const DashboardQuerySchema = z.object({
  /** Janela em dias para métricas de "últimos X dias". Default 90. */
  days: z.coerce.number().int().min(1).max(365).default(90),
});
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
