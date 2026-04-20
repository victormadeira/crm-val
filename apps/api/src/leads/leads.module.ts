import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AutomationBusModule } from "../automation/automation.bus";
import { LeadScoringModule } from "../lead-scoring/lead-scoring.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RottingModule } from "../rotting/rotting.module";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AutomationBusModule,
    RottingModule,
    LeadScoringModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
