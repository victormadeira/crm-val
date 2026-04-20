import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LeadScoringService } from "./lead-scoring.service";

@Module({
  imports: [PrismaModule],
  providers: [LeadScoringService],
  exports: [LeadScoringService],
})
export class LeadScoringModule {}
