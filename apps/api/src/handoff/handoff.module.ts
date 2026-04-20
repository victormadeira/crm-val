import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AutomationBusModule } from "../automation/automation.bus";
import { LeadScoringModule } from "../lead-scoring/lead-scoring.module";
import { PrismaModule } from "../prisma/prisma.module";
import { HandoffController } from "./handoff.controller";
import { HandoffService } from "./handoff.service";

@Module({
  imports: [PrismaModule, AuditModule, AutomationBusModule, LeadScoringModule],
  controllers: [HandoffController],
  providers: [HandoffService],
  exports: [HandoffService],
})
export class HandoffModule {}
