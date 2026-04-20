import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TenantContext } from "../prisma/tenant-context";
import { WeatherService } from "./weather.service";

// 3x por dia (06, 12, 18) + buffer na inicialização
const REFRESH_HOURS = [6, 12, 18];

/**
 * Atualiza previsão climática 3x/dia p/ todos os tenants ativos.
 * O loop dispara a cada 10 min e executa apenas quando o horário da
 * hora corrente bate com REFRESH_HOURS. Idempotente — cache de 4h
 * evita refetches desnecessários no mesmo slot.
 */
@Injectable()
export class WeatherCronService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(WeatherCronService.name);
  private timer: NodeJS.Timeout | null = null;
  private lastSlot: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Primeiro disparo 45s após boot (app estabiliza)
    setTimeout(() => {
      this.runIfSlot().catch((err) =>
        this.logger.error(`weather cron inicial: ${String(err)}`)
      );
    }, 45_000);

    this.timer = setInterval(() => {
      this.runIfSlot().catch((err) =>
        this.logger.error(`weather cron: ${String(err)}`)
      );
    }, 10 * 60 * 1000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
  }

  private async runIfSlot(): Promise<void> {
    const now = new Date();
    const hour = now.getUTCHours();
    if (!REFRESH_HOURS.includes(hour)) return;
    const slot = `${now.toISOString().slice(0, 10)}:${hour}`;
    if (slot === this.lastSlot) return;
    this.lastSlot = slot;
    await this.refreshAll();
  }

  private async refreshAll(): Promise<void> {
    const tenants = await TenantContext.runOutsideTenant(() =>
      this.prisma.tenant.findMany({ select: { id: true } })
    );
    this.logger.log(`weather refresh — ${tenants.length} tenants`);
    for (const t of tenants) {
      try {
        await TenantContext.run({ tenantId: t.id }, () =>
          this.weather.getForecast(16, true)
        );
      } catch (err) {
        this.logger.warn(
          `weather refresh tenant ${t.id} falhou: ${String(err)}`
        );
      }
    }
  }
}
