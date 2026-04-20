import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { LeadScoringModule } from "../lead-scoring/lead-scoring.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RottingModule } from "../rotting/rotting.module";
import { ProposalsController } from "./proposals.controller";
import { ProposalsService } from "./proposals.service";

@Module({
  imports: [PrismaModule, AuditModule, RottingModule, LeadScoringModule],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
