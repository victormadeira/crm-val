import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";

/**
 * Calcula correlação clima×receita via regressão linear simples + médias
 * por categoria/dia. Implementação manual — evita `simple-statistics`.
 *
 * Persiste snapshot em WeatherRevenueCorrelation p/ consulta rápida.
 * Idealmente rodar 1x/semana (ver cron no InsightsService).
 */
@Injectable()
export class CorrelationService {
  private readonly logger = new Logger(CorrelationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalcula correlação usando amostras dos últimos `periodDays` dias.
   * Retorna null se amostra < 15 (confiança estatística insuficiente).
   */
  async recompute(periodDays = 180): Promise<{
    pearsonR: number | null;
    rSquared: number | null;
    slope: number | null;
    intercept: number | null;
    sampleCount: number;
  }> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - periodDays);

    const actuals = await this.prisma.scoped.revenueActual.findMany({
      where: {
        date: { gte: since },
        weatherScoreActual: { not: null },
      },
      select: {
        grossRevenueCents: true,
        weatherScoreActual: true,
        dayType: true,
      },
    });

    // Médias por categoria (via forecast mais próximo da data)
    const categoryAggs = await this.prisma.scoped.$queryRaw<
      Array<{ category: string; avg: number; n: number }>
    >`
      SELECT wf."weatherCategory" as category,
             AVG(ra."grossRevenueCents")::float as avg,
             COUNT(*)::int as n
        FROM "RevenueActual" ra
        JOIN "WeatherForecast" wf
          ON wf."tenantId" = ra."tenantId"
         AND wf."forecastDate" = ra.date
        WHERE ra."tenantId" = ${TenantContext.require().tenantId}::uuid
          AND ra.date >= ${since}
        GROUP BY wf."weatherCategory"
    `;

    const byCat: Record<string, number> = {};
    for (const r of categoryAggs) byCat[r.category] = r.avg / 100; // cents→BRL

    // Médias por tipo de dia
    const dayTypeAggs: Record<string, { sum: number; n: number }> = {};
    for (const a of actuals) {
      const k = a.dayType;
      if (!dayTypeAggs[k]) dayTypeAggs[k] = { sum: 0, n: 0 };
      dayTypeAggs[k].sum += a.grossRevenueCents;
      dayTypeAggs[k].n++;
    }
    const avgOf = (k: string) =>
      dayTypeAggs[k]?.n ? dayTypeAggs[k].sum / dayTypeAggs[k].n / 100 : null;

    // Regressão linear (y=revenue, x=weatherScore)
    const sample = actuals.filter((a) => a.weatherScoreActual != null);
    const n = sample.length;
    let pearsonR: number | null = null;
    let rSquared: number | null = null;
    let slope: number | null = null;
    let intercept: number | null = null;

    if (n >= 15) {
      const xs = sample.map((s) => s.weatherScoreActual as number);
      const ys = sample.map((s) => s.grossRevenueCents);
      const meanX = xs.reduce((a, b) => a + b, 0) / n;
      const meanY = ys.reduce((a, b) => a + b, 0) / n;
      let sxy = 0,
        sxx = 0,
        syy = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        sxy += dx * dy;
        sxx += dx * dx;
        syy += dy * dy;
      }
      if (sxx > 0 && syy > 0) {
        pearsonR = sxy / Math.sqrt(sxx * syy);
        rSquared = pearsonR * pearsonR;
        slope = sxy / sxx;
        intercept = meanY - slope * meanX;
      }
    }

    await this.prisma.scoped.weatherRevenueCorrelation.create({
      data: scopedData({
        periodDays,
        sampleCount: n,
        pearsonR,
        rSquared,
        slope,
        intercept,
        avgRevExcelente: byCat.EXCELENTE ?? null,
        avgRevBom: byCat.BOM ?? null,
        avgRevRegular: byCat.REGULAR ?? null,
        avgRevRuim: byCat.RUIM ?? null,
        avgRevPessimo: byCat.PESSIMO ?? null,
        avgRevWeekend: avgOf("FIM_DE_SEMANA"),
        avgRevHoliday: avgOf("FERIADO"),
        avgRevWeekday: avgOf("DIA_UTIL"),
      }),
    });

    this.logger.log(
      `correlação recalculada — n=${n} r=${pearsonR?.toFixed(3) ?? "n/a"}`
    );
    return { pearsonR, rSquared, slope, intercept, sampleCount: n };
  }

  /** Última correlação persistida (ou null se nunca calculada). */
  async latest() {
    return this.prisma.scoped.weatherRevenueCorrelation.findFirst({
      orderBy: { calculatedAt: "desc" },
    });
  }
}
