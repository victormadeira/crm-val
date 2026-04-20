import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ConfigModule } from "../config/config.module";
import { DistributionModule } from "../distribution/distribution.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WhatsappModule } from "../whatsapp/whatsapp.module";
import { AutomationActions } from "./automation.actions";
import { AutomationController } from "./automation.controller";
import { AutomationCronService } from "./automation.cron";
import { AutomationDispatcher } from "./automation.dispatcher";
import { AutomationQueue } from "./automation.queue";
import { AutomationRunner } from "./automation.runner";
import { AutomationService } from "./automation.service";
import { AutomationWorkerService } from "./automation.worker.service";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
    DistributionModule,
    WhatsappModule,
  ],
  controllers: [AutomationController],
  providers: [
    AutomationQueue,
    AutomationService,
    AutomationActions,
    AutomationRunner,
    AutomationDispatcher,
    AutomationWorkerService,
    AutomationCronService,
  ],
})
export class AutomationModule {}
