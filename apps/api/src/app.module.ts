import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "./config/config.module";
import { CryptoModule } from "./crypto/crypto.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { AuthMiddleware } from "./auth/auth.middleware";
import { AuditModule } from "./audit/audit.module";
import { LeadsModule } from "./leads/leads.module";
import { LgpdModule } from "./lgpd/lgpd.module";
import { WhatsappModule } from "./whatsapp/whatsapp.module";
import { DistributionModule } from "./distribution/distribution.module";
import { AutomationBusModule } from "./automation/automation.bus";
import { AutomationModule } from "./automation/automation.module";
import { ImportsModule } from "./imports/imports.module";
import { LandingsModule } from "./landings/landings.module";
import { ReportsModule } from "./reports/reports.module";
import { PushModule } from "./push/push.module";
import { PipelinesModule } from "./pipelines/pipelines.module";
import { RottingModule } from "./rotting/rotting.module";
import { LeadScoringModule } from "./lead-scoring/lead-scoring.module";
import { TasksModule } from "./tasks/tasks.module";
import { BookingsModule } from "./bookings/bookings.module";
import { ProposalsModule } from "./proposals/proposals.module";
import { AiModule } from "./ai/ai.module";
import { HandoffModule } from "./handoff/handoff.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { GamificationModule } from "./gamification/gamification.module";
import { WeatherModule } from "./weather/weather.module";
import { RevenueIntelligenceModule } from "./revenue-intelligence/revenue-intelligence.module";
import { TenantGuard } from "./tenant/tenant.guard";
import { AllExceptionsFilter } from "./common/exception.filter";

/**
 * AppModule — raiz. Ordem de execução por request:
 *   1. AuthMiddleware extrai JWT e abre TenantContext (via AsyncLocalStorage)
 *   2. ThrottlerGuard aplica rate limit
 *   3. TenantGuard garante autenticação nas rotas não-@Public
 *   4. RolesGuard (no AuthModule) filtra por @Roles
 *   5. Handler executa — já dentro do ALS, portanto PrismaService.scoped
 *      injeta tenantId automaticamente em toda query.
 */
@Module({
  imports: [
    ConfigModule,
    CryptoModule,
    PrismaModule,
    AuditModule,
    AutomationBusModule,
    PushModule,
    AuthModule,
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 120 },
      { name: "auth", ttl: 60_000, limit: 10 },
    ]),
    HealthModule,
    LeadsModule,
    LgpdModule,
    WhatsappModule,
    DistributionModule,
    AutomationModule,
    ImportsModule,
    LandingsModule,
    ReportsModule,
    PipelinesModule,
    RottingModule,
    LeadScoringModule,
    TasksModule,
    BookingsModule,
    ProposalsModule,
    AiModule,
    HandoffModule,
    DashboardModule,
    GamificationModule,
    WeatherModule,
    RevenueIntelligenceModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
