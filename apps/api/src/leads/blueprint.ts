import type { Prisma } from "@prisma/client";

export interface RequiredFieldSpec {
  field: string;
  label: string;
}

/**
 * Dado um Lead e a spec de requiredFields de um PipelineStage, retorna quais
 * campos estão faltando. Suporta:
 *   - Colunas nativas de Lead: "name", "email", "phoneE164", "visitDate", etc.
 *   - Paths em customFields: "customFields.numParticipantes"
 *
 * Lógica de "preenchido":
 *   - null/undefined/"" → faltando
 *   - 0 → preenchido (zero é valor válido em alguns contextos)
 *   - false → preenchido (boolean explícito)
 *   - array vazio → faltando
 */
export function findMissingFields(
  lead: Record<string, unknown> & { customFields?: Prisma.JsonValue | null },
  required: RequiredFieldSpec[]
): RequiredFieldSpec[] {
  const missing: RequiredFieldSpec[] = [];
  const customFields =
    (lead.customFields as Record<string, unknown> | null | undefined) ?? {};

  for (const r of required) {
    if (r.field.startsWith("customFields.")) {
      const key = r.field.slice("customFields.".length);
      if (!isFilled(customFields[key])) missing.push(r);
    } else {
      if (!isFilled(lead[r.field])) missing.push(r);
    }
  }
  return missing;
}

/**
 * Percentual 0..100 de requiredFields preenchidos. Usado em
 * Lead.blueprintCompletion e no contexto do AI summary.
 */
export function blueprintCompletion(
  lead: Record<string, unknown> & { customFields?: Prisma.JsonValue | null },
  required: RequiredFieldSpec[]
): number {
  if (required.length === 0) return 100;
  const missing = findMissingFields(lead, required);
  const filled = required.length - missing.length;
  return Math.round((filled / required.length) * 100);
}

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}
