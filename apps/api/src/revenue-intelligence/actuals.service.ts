import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import type { DayType, RainIntensity } from "@prisma/client";
import type {
  RevenueActualInput,
  RevenueActualPatch,
  RevenueCsvImport,
} from "@valparaiso/shared";
import { parse } from "csv-parse/sync";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { WeatherService } from "../weather/weather.service";

const CSV_HEADERS = [
  "date",
  "grossRevenueCents",
  "visitorCount",
  "capacityPct",
  "capacityTotal",
  "tempMaxActual",
  "hadRain",
  "rainIntensity",
  "dayType",
  "promotionsActive",
  "groupsCount",
  "groupsRevenueCents",
  "avulsoRevenueCents",
  "notes",
] as const;

/**
 * CRUD + importação CSV de RevenueActual. Linka automaticamente com
 * weatherForecast da mesma data p/ popular `weatherScoreActual`.
 */
@Injectable()
export class ActualsService {
  private readonly logger = new Logger(ActualsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService
  ) {}

  async list(params: { since?: string; until?: string; limit?: number } = {}) {
    const where: Record<string, unknown> = {};
    if (params.since || params.until) {
      where.date = {
        ...(params.since ? { gte: new Date(params.since + "T00:00:00Z") } : {}),
        ...(params.until ? { lte: new Date(params.until + "T00:00:00Z") } : {}),
      };
    }
    return this.prisma.scoped.revenueActual.findMany({
      where,
      orderBy: { date: "desc" },
      take: params.limit ?? 180,
    });
  }

  async upsert(input: RevenueActualInput) {
    const date = new Date(input.date + "T00:00:00Z");
    const existing = await this.prisma.scoped.revenueActual.findFirst({
      where: { date },
    });
    const score = await this.resolveWeatherScore(input.date);
    const ticketAvg =
      input.visitorCount && input.visitorCount > 0
        ? Math.round(input.grossRevenueCents / input.visitorCount)
        : null;

    const data = {
      date,
      grossRevenueCents: input.grossRevenueCents,
      visitorCount: input.visitorCount ?? null,
      ticketAvgCents: ticketAvg,
      capacityPct: input.capacityPct ?? null,
      capacityTotal: input.capacityTotal ?? null,
      tempMaxActual: input.tempMaxActual ?? null,
      weatherScoreActual: score,
      hadRain: input.hadRain ?? false,
      rainIntensity: (input.rainIntensity ?? "NENHUMA") as RainIntensity,
      dayType: input.dayType as DayType,
      promotionsActive: input.promotionsActive,
      groupsCount: input.groupsCount ?? null,
      groupsRevenueCents: input.groupsRevenueCents ?? null,
      avulsoRevenueCents: input.avulsoRevenueCents ?? null,
      notes: input.notes ?? null,
    };

    if (existing) {
      return this.prisma.scoped.revenueActual.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.scoped.revenueActual.create({ data: scopedData(data) });
  }

  async patch(dateStr: string, patch: RevenueActualPatch) {
    const date = new Date(dateStr + "T00:00:00Z");
    const existing = await this.prisma.scoped.revenueActual.findFirst({
      where: { date },
    });
    if (!existing) throw new BadRequestException(`sem actual em ${dateStr}`);
    return this.prisma.scoped.revenueActual.update({
      where: { id: existing.id },
      data: patch as never,
    });
  }

  async remove(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00Z");
    const existing = await this.prisma.scoped.revenueActual.findFirst({
      where: { date },
    });
    if (!existing) return { removed: 0 };
    await this.prisma.scoped.revenueActual.delete({ where: { id: existing.id } });
    return { removed: 1 };
  }

  /**
   * Importa CSV (header obrigatório). `dryRun=true` apenas valida,
   * retornando preview. `overwrite=false` preserva registros existentes.
   */
  async importCsv(
    input: RevenueCsvImport
  ): Promise<{
    parsed: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
    preview: Array<Record<string, unknown>>;
  }> {
    let rows: Array<Record<string, string>>;
    try {
      rows = parse(input.csv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      throw new BadRequestException(`CSV inválido: ${String(err)}`);
    }

    const errors: Array<{ row: number; message: string }> = [];
    const normalized: RevenueActualInput[] = [];
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      try {
        const parsed: RevenueActualInput = {
          date: raw.date,
          grossRevenueCents: Number(raw.grossRevenueCents),
          visitorCount: raw.visitorCount ? Number(raw.visitorCount) : undefined,
          capacityPct: raw.capacityPct ? Number(raw.capacityPct) : undefined,
          capacityTotal: raw.capacityTotal
            ? Number(raw.capacityTotal)
            : undefined,
          tempMaxActual: raw.tempMaxActual
            ? Number(raw.tempMaxActual)
            : undefined,
          hadRain:
            raw.hadRain?.toLowerCase() === "true" || raw.hadRain === "1",
          rainIntensity:
            (raw.rainIntensity as RainIntensity) || undefined,
          dayType: raw.dayType as DayType,
          promotionsActive: raw.promotionsActive
            ? raw.promotionsActive.split("|").filter(Boolean)
            : [],
          groupsCount: raw.groupsCount ? Number(raw.groupsCount) : undefined,
          groupsRevenueCents: raw.groupsRevenueCents
            ? Number(raw.groupsRevenueCents)
            : undefined,
          avulsoRevenueCents: raw.avulsoRevenueCents
            ? Number(raw.avulsoRevenueCents)
            : undefined,
          notes: raw.notes || undefined,
        };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
          throw new Error("data inválida (esperado YYYY-MM-DD)");
        }
        if (!Number.isFinite(parsed.grossRevenueCents)) {
          throw new Error("grossRevenueCents inválido");
        }
        normalized.push(parsed);
      } catch (err) {
        errors.push({ row: i + 2, message: String(err) });
      }
    }

    const preview = normalized.slice(0, 10);
    if (input.dryRun) {
      return {
        parsed: normalized.length,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors,
        preview,
      };
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    for (const row of normalized) {
      const date = new Date(row.date + "T00:00:00Z");
      const existing = await this.prisma.scoped.revenueActual.findFirst({
        where: { date },
      });
      if (existing && !input.overwrite) {
        skipped++;
        continue;
      }
      await this.upsert(row);
      existing ? updated++ : inserted++;
    }
    this.logger.log(
      `CSV import — parsed=${normalized.length} ins=${inserted} upd=${updated} skip=${skipped}`
    );
    return {
      parsed: normalized.length,
      inserted,
      updated,
      skipped,
      errors,
      preview,
    };
  }

  /** Header CSV de referência (download). */
  csvTemplate(): string {
    return CSV_HEADERS.join(",") + "\n";
  }

  private async resolveWeatherScore(dateStr: string): Promise<number | null> {
    try {
      const s = await this.weather.getScoreByDate(dateStr);
      return s?.score ?? null;
    } catch {
      return null;
    }
  }
}
