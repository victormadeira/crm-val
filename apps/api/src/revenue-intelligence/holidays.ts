import { DayType } from "@prisma/client";

/**
 * Feriados nacionais fixos + alguns móveis relevantes ao Maranhão.
 * Lista enxuta — evita dependência `date-holidays`. Atualizar
 * manualmente a cada 2 anos é aceitável.
 */
const FIXED_HOLIDAYS: Array<[number, number]> = [
  [1, 1],   // Confraternização
  [4, 21],  // Tiradentes
  [5, 1],   // Trabalho
  [9, 7],   // Independência
  [10, 12], // Padroeira
  [11, 2],  // Finados
  [11, 15], // Proclamação
  [11, 20], // Consciência Negra
  [12, 25], // Natal
];

// Móveis conhecidos (Carnaval, Paixão, Corpus Christi)
const MOVABLE_HOLIDAYS: Record<string, string[]> = {
  "2025": ["2025-03-03", "2025-03-04", "2025-04-18", "2025-06-19"],
  "2026": ["2026-02-16", "2026-02-17", "2026-04-03", "2026-06-04"],
  "2027": ["2027-02-08", "2027-02-09", "2027-03-26", "2027-05-27"],
};

export function isHoliday(date: Date): boolean {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  if (FIXED_HOLIDAYS.some(([mm, dd]) => mm === m && dd === d)) return true;
  const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return (MOVABLE_HOLIDAYS[String(y)] ?? []).includes(key);
}

export function classifyDayType(date: Date): DayType {
  if (isHoliday(date)) return "FERIADO";
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return "FIM_DE_SEMANA";
  return "DIA_UTIL";
}
