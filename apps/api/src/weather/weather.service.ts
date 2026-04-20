import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from "@nestjs/common";
import IORedis from "ioredis";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";
import { calculateWeatherScore, type WeatherDay } from "./weather-score";

const CACHE_TTL_SECONDS = 4 * 60 * 60; // 4h PRD
const DEFAULT_DAYS = 16;

interface OpenMeteoResponse {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
    uv_index_max: number[];
    weathercode: number[];
  };
}

export interface ForecastDayDto {
  date: string; // YYYY-MM-DD
  tempMax: number;
  tempMin: number;
  precipProbability: number;
  precipSum: number;
  windspeedMax: number;
  uvIndexMax: number;
  weathercode: number;
  score: number;
  category: string;
}

/**
 * Integração Open-Meteo + persistência + cache. API é gratuita e não exige
 * chave. Coordenadas vêm de env (PARK_LATITUDE/LONGITUDE).
 *
 * Fluxo: `getForecast` serve do cache Redis (4h); se miss, consulta Open-Meteo,
 * calcula score e persiste em WeatherForecast. Dentro de TenantContext o
 * persist é scoped — fora, chamar `getForecastCrossTenant` p/ cada tenant.
 */
@Injectable()
export class WeatherService implements OnModuleDestroy {
  private readonly logger = new Logger(WeatherService.name);
  private readonly redis: IORedis;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV_TOKEN) private readonly env: Env
  ) {
    this.redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }

  private key(tenantId: string, days: number): string {
    return `weather:forecast:${tenantId}:${days}`;
  }

  async getForecast(days = DEFAULT_DAYS, force = false): Promise<{
    days: ForecastDayDto[];
    cached: boolean;
    fetchedAt: string;
  }> {
    const ctx = TenantContext.require();
    const cacheKey = this.key(ctx.tenantId, days);

    if (!force) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          return { ...parsed, cached: true };
        } catch {
          // cache corrompido, recomputa
        }
      }
    }

    const raw = await this.fetchOpenMeteo(days);
    const list = this.parseAndScore(raw);
    const fetchedAt = new Date().toISOString();

    // Persistir snapshot
    try {
      await this.prisma.scoped.$transaction(async (tx) => {
        for (const d of list) {
          await tx.weatherForecast.create({
            data: scopedData({
              forecastDate: new Date(d.date + "T00:00:00Z"),
              tempMax: d.tempMax,
              tempMin: d.tempMin,
              precipProbability: d.precipProbability,
              precipSum: d.precipSum,
              windspeedMax: d.windspeedMax,
              uvIndexMax: d.uvIndexMax,
              weathercode: d.weathercode,
              weatherScore: d.score,
              weatherCategory: d.category,
            }),
          });
        }
      });
    } catch (err) {
      this.logger.warn(`persist weather forecast falhou: ${String(err)}`);
    }

    const payload = { days: list, fetchedAt };
    await this.redis.setex(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify(payload)
    );
    return { ...payload, cached: false };
  }

  /**
   * Score de uma data específica. Retorna previsão mais recente ou null
   * se não há forecast persistido (nunca foi consultado) — chama primeiro
   * `getForecast` para popular.
   */
  async getScoreByDate(dateStr: string): Promise<{
    date: string;
    score: number;
    category: string;
    fromHistoricalForecast: boolean;
  } | null> {
    const target = new Date(dateStr + "T00:00:00Z");
    const record = await this.prisma.scoped.weatherForecast.findFirst({
      where: { forecastDate: target },
      orderBy: { fetchedAt: "desc" },
      select: { weatherScore: true, weatherCategory: true, fetchedAt: true },
    });
    if (record) {
      return {
        date: dateStr,
        score: record.weatherScore,
        category: record.weatherCategory,
        fromHistoricalForecast: true,
      };
    }
    // fallback: força fetch da previsão atual e procura de novo
    const fresh = await this.getForecast(DEFAULT_DAYS);
    const match = fresh.days.find((d) => d.date === dateStr);
    return match
      ? {
          date: dateStr,
          score: match.score,
          category: match.category,
          fromHistoricalForecast: false,
        }
      : null;
  }

  private async fetchOpenMeteo(days: number): Promise<OpenMeteoResponse> {
    const url = new URL(this.env.OPEN_METEO_BASE_URL);
    url.searchParams.set("latitude", String(this.env.PARK_LATITUDE));
    url.searchParams.set("longitude", String(this.env.PARK_LONGITUDE));
    url.searchParams.set(
      "daily",
      [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "precipitation_sum",
        "windspeed_10m_max",
        "uv_index_max",
        "weathercode",
      ].join(",")
    );
    url.searchParams.set("timezone", this.env.PARK_TIMEZONE);
    url.searchParams.set("forecast_days", String(Math.min(16, Math.max(1, days))));

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15_000);
    try {
      const resp = await fetch(url.toString(), { signal: ctrl.signal });
      if (!resp.ok) {
        throw new Error(`Open-Meteo ${resp.status}: ${await resp.text()}`);
      }
      return (await resp.json()) as OpenMeteoResponse;
    } finally {
      clearTimeout(t);
    }
  }

  private parseAndScore(raw: OpenMeteoResponse): ForecastDayDto[] {
    const daily = raw.daily;
    if (!daily) return [];
    const out: ForecastDayDto[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      const day: WeatherDay = {
        tempMax: daily.temperature_2m_max[i] ?? 0,
        tempMin: daily.temperature_2m_min[i] ?? 0,
        precipProbability: daily.precipitation_probability_max[i] ?? 0,
        precipSum: daily.precipitation_sum[i] ?? 0,
        windspeedMax: daily.windspeed_10m_max[i] ?? 0,
        uvIndexMax: daily.uv_index_max[i] ?? 0,
        weathercode: daily.weathercode[i] ?? 0,
      };
      const { score, category } = calculateWeatherScore(day);
      out.push({
        date: daily.time[i],
        ...day,
        score,
        category,
      });
    }
    return out;
  }

  /** Invalidar cache de forecast — chamar após mudar coordenadas. */
  async invalidateCache(tenantId: string): Promise<void> {
    const patterns = [1, 7, 14, 16].map((d) => this.key(tenantId, d));
    await this.redis.del(...patterns);
  }
}
