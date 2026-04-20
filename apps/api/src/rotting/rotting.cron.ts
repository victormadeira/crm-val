import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { RottingService } from "./rotting.service";

const RECOMPUTE_EVERY_MS = 60 * 60 * 1000; // 1h

/**
 * Recalcula rottingStatus de todos os leads ativos a cada hora. Roda a
 * primeira vez 30s após bootstrap (deixa a app estabilizar) e depois de
 * hora em hora. Usa setInterval (não BullMQ) porque é cross-tenant e
 * sistema-wide, não precisa de filas distribuídas.
 */
@Injectable()
export class RottingCronService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RottingCronService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly rotting: RottingService) {}

  async onApplicationBootstrap(): Promise<void> {
    setTimeout(() => {
      this.rotting
        .recomputeAll()
        .catch((err) => this.logger.error(`rotting inicial falhou: ${String(err)}`));
    }, 30_000);

    this.timer = setInterval(() => {
      this.rotting.recomputeAll().catch((err) =>
        this.logger.error(`rotting recompute falhou: ${String(err)}`)
      );
    }, RECOMPUTE_EVERY_MS);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
  }
}
