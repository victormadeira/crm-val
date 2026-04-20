import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AiController } from "./ai.controller";
import { AiSummaryService } from "./ai-summary.service";

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiSummaryService],
  exports: [AiSummaryService],
})
export class AiModule {}
