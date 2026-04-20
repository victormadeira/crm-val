import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RottingService } from "./rotting.service";
import { RottingCronService } from "./rotting.cron";

@Module({
  imports: [PrismaModule],
  providers: [RottingService, RottingCronService],
  exports: [RottingService],
})
export class RottingModule {}
