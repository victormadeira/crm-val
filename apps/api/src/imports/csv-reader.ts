import { parse } from "csv-parse/sync";

/**
 * Leitor de CSV tolerante — detecta `;` vs `,` pela primeira linha,
 * aceita BOM, normaliza headers para lowerCamel-ish. Small-footprint
 * porque o importador roda em worker já isolado; se crescermos p/
 * arquivos grandes (>50k linhas), migrar para `csv-parse` streaming.
 */
export interface CsvReadResult {
  headers: string[];
  rows: Record<string, string>[];
  delimiter: "," | ";";
}

export function readCsv(content: string, maxRows?: number): CsvReadResult {
  const clean = content.replace(/^\uFEFF/, "").trimStart();
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter: "," | ";" =
    (firstLine.match(/;/g)?.length ?? 0) >
    (firstLine.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const records = parse(clean, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter,
    relax_column_count: true,
    bom: true,
    to: maxRows,
  }) as Record<string, string>[];

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  return { headers, rows: records, delimiter };
}

/** Heurística de detecção p/ sugerir field map no preview. */
export function guessTargetField(
  header: string
): import("@valparaiso/shared").ImportTargetField | null {
  const h = header.toLowerCase().replace(/[_\s-]/g, "");
  if (/(name|nome)/.test(h)) return "name";
  if (/(phone|telefone|celular|whats)/.test(h)) return "phoneE164";
  if (/(email|mail)/.test(h)) return "email";
  if (/(visit|visita|datavisita)/.test(h)) return "visitDate";
  if (/(size|grupo|pessoas|qtd)/.test(h)) return "groupSize";
  if (/(interest|interesse|produto)/.test(h)) return "productInterest";
  if (/(city|cidade)/.test(h)) return "cityGuess";
  if (/(campaign|campanha)/.test(h)) return "sourceCampaign";
  if (/(adset|conjunto)/.test(h)) return "sourceAdset";
  if (/(^ad$|^anuncio$)/.test(h)) return "sourceAd";
  if (/fbclid/.test(h)) return "sourceFbclid";
  if (/gclid/.test(h)) return "sourceGclid";
  return null;
}
