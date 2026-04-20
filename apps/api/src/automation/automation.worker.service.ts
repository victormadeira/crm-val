import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { TenantContext } from "../prisma/tenant-context";
import { AutomationQueue } from "./automation.queue";
import { AutomationRunner } from "./automation.runner";

/**
 * Registra o processor BullMQ para a fila AUTOMATION_RUN_QUEUE. Cada
 * job processa UM nó — o próximo (se existir) é re-enfileirado pelo
 * runner. Envelope TenantContext garante que todo Prisma scoped
 * injete o tenantId correto.
 */
@Injectable()
export class AutomationWorkerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AutomationWorkerService.name);

  constructor(
    private readonly queue: AutomationQueue,
    private readonly runner: AutomationRunner
  ) {}

  onApplicationBootstrap(): void {
    this.queue.registerProcessor(async (job) => {
      await TenantContext.run(
        { tenantId: job.data.tenantId, userId: "__automation__" },
        () => this.runner.tick(job.data, job.attemptsMade + 1)
      );
    });
  }
}
