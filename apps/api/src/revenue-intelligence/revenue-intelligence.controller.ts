import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import type { PricingProduct } from "@prisma/client";
import {
  DateParamSchema,
  InsightFeedbackSchema,
  PRICING_PRODUCTS,
  PricingConfigUpdateSchema,
  RevenueActualInputSchema,
  RevenueActualPatchSchema,
  RevenueCsvImportSchema,
  type InsightFeedback,
  type PricingConfigUpdate,
  type RevenueActualInput,
  type RevenueActualPatch,
  type RevenueCsvImport,
} from "@valparaiso/shared";
import { Roles } from "../auth/roles.guard";
import { ZodValidationPipe } from "../auth/zod.pipe";
import { ActualsService } from "./actuals.service";
import { CorrelationService } from "./correlation.service";
import { ForecastService } from "./forecast.service";
import { InsightsService } from "./insights.service";
import { PricingService } from "./pricing.service";

function parseProduct(raw: string): PricingProduct {
  if (!PRICING_PRODUCTS.includes(raw as PricingProduct)) {
    throw new BadRequestException(`produto inválido: ${raw}`);
  }
  return raw as PricingProduct;
}

@Controller("revenue-intelligence")
export class RevenueIntelligenceController {
  constructor(
    private readonly actuals: ActualsService,
    private readonly pricing: PricingService,
    private readonly forecast: ForecastService,
    private readonly correlation: CorrelationService,
    private readonly insights: InsightsService
  ) {}

  /* ─── Actuals ─── */

  @Get("actuals")
  @Roles("ADMIN", "SUPERVISOR")
  listActuals(
    @Query("since") since?: string,
    @Query("until") until?: string,
    @Query("limit") limit?: string
  ) {
    return this.actuals.list({
      since,
      until,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("actuals")
  @Roles("ADMIN", "SUPERVISOR")
  createActual(
    @Body(new ZodValidationPipe(RevenueActualInputSchema))
    body: RevenueActualInput
  ) {
    return this.actuals.upsert(body);
  }

  @Patch("actuals/:date")
  @Roles("ADMIN", "SUPERVISOR")
  patchActual(
    @Param(new ZodValidationPipe(DateParamSchema)) p: { date: string },
    @Body(new ZodValidationPipe(RevenueActualPatchSchema))
    body: RevenueActualPatch
  ) {
    return this.actuals.patch(p.date, body);
  }

  @Delete("actuals/:date")
  @Roles("ADMIN")
  deleteActual(
    @Param(new ZodValidationPipe(DateParamSchema)) p: { date: string }
  ) {
    return this.actuals.remove(p.date);
  }

  @Post("actuals/import-csv")
  @Roles("ADMIN", "SUPERVISOR")
  importCsv(
    @Body(new ZodValidationPipe(RevenueCsvImportSchema)) body: RevenueCsvImport
  ) {
    return this.actuals.importCsv(body);
  }

  @Get("actuals/template.csv")
  @Roles("ADMIN", "SUPERVISOR")
  csvTemplate() {
    return { template: this.actuals.csvTemplate() };
  }

  /* ─── Pricing ─── */

  @Get("pricing")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  listPricing() {
    return this.pricing.list();
  }

  @Post("pricing/seed-defaults")
  @Roles("ADMIN")
  async seedPricing() {
    await this.pricing.upsertDefaults();
    return { ok: true };
  }

  @Put("pricing/:product")
  @Roles("ADMIN", "SUPERVISOR")
  updatePricing(
    @Param("product") product: string,
    @Body(new ZodValidationPipe(PricingConfigUpdateSchema))
    body: PricingConfigUpdate
  ) {
    return this.pricing.update(parseProduct(product), body);
  }

  @Get("pricing/grid/:date")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  priceGrid(
    @Param(new ZodValidationPipe(DateParamSchema)) p: { date: string }
  ) {
    return this.pricing.priceGrid(p.date);
  }

  @Get("pricing/:product/:date")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  priceFor(
    @Param("product") product: string,
    @Param("date") date: string
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new BadRequestException("data inválida");
    return this.pricing.priceFor(parseProduct(product), date);
  }

  /* ─── Forecast / Correlation ─── */

  @Get("forecast")
  @Roles("ADMIN", "SUPERVISOR", "ATTENDANT")
  forecastDays(@Query("days") days?: string) {
    const d = Math.max(1, Math.min(16, Number(days) || 14));
    return this.forecast.forecastDays(d);
  }

  @Get("correlation")
  @Roles("ADMIN", "SUPERVISOR")
  latestCorrelation() {
    return this.correlation.latest();
  }

  @Post("correlation/recompute")
  @Roles("ADMIN")
  recomputeCorrelation(@Query("days") days?: string) {
    return this.correlation.recompute(
      days ? Math.max(30, Math.min(720, Number(days))) : 180
    );
  }

  /* ─── Insights ─── */

  @Get("insights")
  @Roles("ADMIN", "SUPERVISOR")
  listInsights(
    @Query("since") since?: string,
    @Query("limit") limit?: string
  ) {
    return this.insights.list({
      since,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("insights/generate")
  @Roles("ADMIN")
  generateInsights() {
    return this.insights.generate();
  }

  @Post("insights/:id/feedback")
  @Roles("ADMIN", "SUPERVISOR")
  insightFeedback(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(InsightFeedbackSchema)) body: InsightFeedback
  ) {
    return this.insights.feedback(id, body);
  }
}
