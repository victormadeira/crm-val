/**
 * Normaliza telefone para E.164 brasileiro. Aceita:
 *   (41) 9 9999-9999 / 41999999999 / +5541999999999 / 5541999999999
 * e devolve sempre +55DDDNNNNNNNNN. Lança se não conseguir reconhecer.
 *
 * Regras:
 *   - Remove tudo que não for dígito ou +.
 *   - Se começar com +, assume já E.164 e valida tamanho (8..15 dígitos).
 *   - Se começar com 55 e tiver 12 ou 13 dígitos → +55...
 *   - 10 dígitos (fixo DDD+8) ou 11 dígitos (celular DDD+9) → +55...
 */
export function normalizeBrPhone(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("Telefone vazio");

  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      throw new Error(`Telefone E.164 com tamanho inválido: ${raw}`);
    }
    return `+${digits}`;
  }

  const only = raw.replace(/\D/g, "");

  if (only.startsWith("55") && (only.length === 12 || only.length === 13)) {
    return `+${only}`;
  }
  if (only.length === 10 || only.length === 11) {
    return `+55${only}`;
  }

  throw new Error(`Telefone não reconhecido: ${input}`);
}
