import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { PricingProduct, WeatherCategory } from "@prisma/client";
import type { PricingConfigUpdate } from "@valparaiso/shared";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { classifyDayType } from "./holidays";
import { WeatherService } from "../weather/weather.service";

const DEFAULT_BASE_PRICES: Record<PricingProduct, number> = {
  INGRESSO_AVULSO: 12000, // R$ 120
  PASSAPORTE_DIA: 18000, // R$ 180
  PASSAPORTE_MENSAL: 25000,
  PASSAPORTE_ANUAL: 89900,
  GRUPO_ESCOLAR: 8000,
  GRUPO_CORPORATIVO: 15000,
};

/**
 * Preço dinâmico = basePrice × mult(categoriaClimática) × fatorDia.
 * Respeita floor/ceiling e permite override por gestor (PricingConfig).
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService
  ) {}

  async list() {
    return this.prisma.scoped.pricingConfig.findMany({
      orderBy: { product: "asc" },
    });
  }

  async upsertDefaults() {
    for (const [product, basePriceCents] of Object.entries(
      DEFAULT_BASE_PRICES
    )) {
      const existing = await this.prisma.scoped.pricingConfig.findFirst({
        where: { product: product as PricingProduct },
      });
      if (existing) continue;
      await this.prisma.scoped.pricingConfig.create({
        data: scopedData({ product: product as PricingProduct, basePriceCents }),
      });
    }
  }

  async update(product: PricingProduct, patch: PricingConfigUpdate) {
    const current = await this.prisma.scoped.pricingConfig.findFirst({
      where: { product },
    });
    if (!current) {
      return this.prisma.scoped.pricingConfig.create({
        data: scopedData({
          product,
          basePriceCents: patch.basePriceCents ?? DEFAULT_BASE_PRICES[product],
          ...patch,
        }),
      });
    }
    return this.prisma.scoped.pricingConfig.update({
      where: { id: current.id },
      data: patch,
    });
  }

  /**
   * Calcula preço recomendado p/ um produto em uma data futura.
   * Combina multiplicador climático + fator de dia (fds/feriado = +, dia útil = -).
   */
  async priceFor(
    product: PricingProduct,
    dateStr: string
  ): Promise<{
    product: PricingProduct;
    date: string;
    basePriceCents: number;
    recommendedCents: number;
    multWeather: number;
    multDayType: number;
    category: WeatherCategory | null;
    dayType: string;
    floorApplied: boolean;
    ceilingApplied: boolean;
  }> {
    const cfg = await this.prisma.scoped.pricingConfig.findFirst({
      where: { product },
    });
    if (!cfg) throw new NotFoundException(`preço não configurado: ${product}`);
    if (!cfg.isActive)
      return {
        product,
        date: dateStr,
        basePriceCents: cfg.basePriceCents,
        recommendedCents: cfg.basePriceCents,
        multWeather: 1,
        multDayType: 1,
        category: null,
        dayType: "INATIVO",
        floorApplied: false,
        ceilingApplied: false,
      };

    const scoreInfo = await this.weather.getScoreByDate(dateStr);
    const category = (scoreInfo?.category as WeatherCategory) ?? null;

    const multWeather =
      category === "EXCELENTE"
        ? cfg.multExcelente
        : category === "BOM"
          ? cfg.multBom
          : category === "REGULAR"
            ? cfg.multRegular
            : category === "RUIM"
              ? cfg.multRuim
              : category === "PESSIMO"
                ? cfg.multPessimo
                : 1;

    const dayType = classifyDayType(new Date(dateStr + "T00:00:00Z"));
    const multDayType =
      dayType === "FERIADO" ? 1.15 : dayType === "FIM_DE_SEMANA" ? 1.08 : 0.95;

    let recommended = Math.round(cfg.basePriceCents * multWeather * multDayType);
    let floorApplied = false;
    let ceilingApplied = false;
    if (cfg.minPriceCents != null && recommended < cfg.minPriceCents) {
      recommended = cfg.minPriceCents;
      floorApplied = true;
    }
    if (cfg.maxPriceCents != null && recommended > cfg.maxPriceCents) {
      recommended = cfg.maxPriceCents;
      ceilingApplied = true;
    }

    return {
      product,
      date: dateStr,
      basePriceCents: cfg.basePriceCents,
      recommendedCents: recommended,
      multWeather,
      multDayType,
      category,
      dayType,
      floorApplied,
      ceilingApplied,
    };
  }

  /** Grade de preços p/ todos produtos em uma data. */
  async priceGrid(dateStr: string) {
    const products: PricingProduct[] = [
      "INGRESSO_AVULSO",
      "PASSAPORTE_DIA",
      "PASSAPORTE_MENSAL",
      "PASSAPORTE_ANUAL",
      "GRUPO_ESCOLAR",
      "GRUPO_CORPORATIVO",
    ];
    const out = [];
    for (const p of products) {
      try {
        out.push(await this.priceFor(p, dateStr));
      } catch (err) {
        this.logger.warn(`priceFor ${p} ${dateStr}: ${String(err)}`);
      }
    }
    return out;
  }
}
