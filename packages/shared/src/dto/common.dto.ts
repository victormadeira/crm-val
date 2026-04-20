import { z } from "zod";

export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResultSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });

/**
 * E.164 estrito: + seguido de 8 a 15 dígitos. Vale para todo input de
 * telefone no CRM. Nunca aceitar variantes locais — padronizar no cliente.
 */
export const PhoneE164Schema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Telefone deve ser E.164, ex.: +5541999999999");
export type PhoneE164 = z.infer<typeof PhoneE164Schema>;
