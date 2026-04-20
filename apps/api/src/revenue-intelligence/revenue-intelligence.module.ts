import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { WeatherModule } from "../weather/weather.module";
import { ActualsService } from "./actuals.service";
import { CorrelationService } from "./correlation.service";
import { ForecastService } from "./forecast.service";
import { InsightsService } from "./insights.service";
import { PricingService } from "./pricing.service";
import { RevenueIntelligenceController } from "./revenue-intelligence.controller";
import { RevenueIntelligenceCronService } from "./revenue-intelligence.cron";

@Module({
  imports: [PrismaModule, WeatherModule],
  controllers: [RevenueIntelligenceController],
  providers: [
    ActualsService,
    CorrelationService,
    ForecastService,
    InsightsService,
    PricingService,
    RevenueIntelligenceCronService,
  ],
  exports: [
    ActualsService,
    CorrelationService,
    ForecastService,
    InsightsService,
    PricingService,
  ],
})
export class RevenueIntelligenceModule {}
