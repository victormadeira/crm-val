import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TenantContext } from "../prisma/tenant-context";
import { CorrelationService } from "./correlation.service";
import { InsightsService } from "./insights.service";

const INSIGHTS_HOUR_UTC = 10; // 07:00 America/Fortaleza (UTC-3)
const CORRELATION_WEEKDAY = 1; // segunda-feira
const CORRELATION_HOUR_UTC = 9;

/**
 * Dispara insights diários (~07:00 local) e recalcula correlação
 * semanalmente (segunda ~06:00 local). Loop every 10min com slot dedup
 * — mesma abordagem do WeatherCronService.
 */
@Injectable()
export class RevenueIntelligenceCronService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RevenueIntelligenceCronService.name);
  private timer: NodeJS.Timeout | null = null;
  private lastInsightsSlot: string | null = null;
  private lastCorrelationSlot: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly insights: InsightsService,
    private readonly correlation: CorrelationService
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => {
      this.tick().catch((err) =>
        this.logger.error(`revenue intelligence cron: ${String(err)}`)
      );
    }, 10 * 60 * 1000);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    const now = new Date();
    const hour = now.getUTCHours();
    const weekday = now.getUTCDay();
    const dayKey = now.toISOString().slice(0, 10);

    if (hour === INSIGHTS_HOUR_UTC && this.lastInsightsSlot !== dayKey) {
      this.lastInsightsSlot = dayKey;
      await this.runPerTenant("insights", async () => {
        await this.insights.generate();
      });
    }

    if (
      weekday === CORRELATION_WEEKDAY &&
      hour === CORRELATION_HOUR_UTC &&
      this.lastCorrelationSlot !== dayKey
    ) {
      this.lastCorrelationSlot = dayKey;
      await this.runPerTenant("correlation", async () => {
        await this.correlation.recompute(180);
      });
    }
  }

  private async runPerTenant(
    label: string,
    fn: () => Promise<void>
  ): Promise<void> {
    const tenants = await TenantContext.runOutsideTenant(() =>
      this.prisma.tenant.findMany({ select: { id: true } })
    );
    this.logger.log(`${label} — ${tenants.length} tenants`);
    for (const t of tenants) {
      try {
        await TenantContext.run({ tenantId: t.id }, fn);
      } catch (err) {
        this.logger.warn(`${label} tenant ${t.id}: ${String(err)}`);
      }
    }
  }
}
