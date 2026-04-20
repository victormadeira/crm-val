import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CorrelationService } from "./correlation.service";
import { classifyDayType } from "./holidays";
import { WeatherService } from "../weather/weather.service";

/**
 * Previsão de receita combinando: regressão linear clima→receita +
 * média histórica por categoria/dia. Usa regressão se amostra >=15,
 * fallback p/ tabela de médias (mais robusto a outliers iniciais).
 */
@Injectable()
export class ForecastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService,
    private readonly correlation: CorrelationService
  ) {}

  async forecastDays(days = 14) {
    const wx = await this.weather.getForecast(days);
    const latest = await this.correlation.latest();
    const slope = latest?.slope ?? null;
    const intercept = latest?.intercept ?? null;
    const sampleOk = latest && latest.sampleCount >= 15;

    const fallbackByCategory: Record<string, number> = {
      EXCELENTE: latest?.avgRevExcelente ?? 0,
      BOM: latest?.avgRevBom ?? 0,
      REGULAR: latest?.avgRevRegular ?? 0,
      RUIM: latest?.avgRevRuim ?? 0,
      PESSIMO: latest?.avgRevPessimo ?? 0,
    };

    const dayTypeMul: Record<string, number> = {
      FERIADO: 1.3,
      FIM_DE_SEMANA: 1.15,
      DIA_UTIL: 0.85,
      EVENTO_ESPECIAL: 1.5,
    };

    return wx.days.map((d) => {
      const dayType = classifyDayType(new Date(d.date + "T00:00:00Z"));
      let expectedRevenue = 0;
      let method: "REGRESSION" | "CATEGORY_AVG" | "NONE" = "NONE";
      if (sampleOk && slope != null && intercept != null) {
        expectedRevenue = Math.max(0, slope * d.score + intercept);
        method = "REGRESSION";
      } else if (fallbackByCategory[d.category]) {
        expectedRevenue = fallbackByCategory[d.category] * 100; // BRL→cents
        method = "CATEGORY_AVG";
      }
      const adjusted = Math.round(expectedRevenue * (dayTypeMul[dayType] ?? 1));
      return {
        date: d.date,
        weatherScore: d.score,
        weatherCategory: d.category,
        dayType,
        expectedRevenueCents: adjusted,
        method,
        confidence:
          method === "REGRESSION"
            ? Math.round((latest?.rSquared ?? 0) * 100)
            : method === "CATEGORY_AVG"
              ? 40
              : 0,
      };
    });
  }

  /** Variação vs mesma data do ano anterior (y/y %). */
  async yoyFor(dateStr: string): Promise<number | null> {
    const target = new Date(dateStr + "T00:00:00Z");
    const prev = new Date(target);
    prev.setUTCFullYear(prev.getUTCFullYear() - 1);
    const [curr, prior] = await Promise.all([
      this.prisma.scoped.revenueActual.findFirst({ where: { date: target } }),
      this.prisma.scoped.revenueActual.findFirst({ where: { date: prev } }),
    ]);
    if (!curr || !prior || prior.grossRevenueCents === 0) return null;
    return (
      ((curr.grossRevenueCents - prior.grossRevenueCents) /
        prior.grossRevenueCents) *
      100
    );
  }
}
