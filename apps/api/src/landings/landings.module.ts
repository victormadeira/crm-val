import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LandingsController } from "./landings.controller";
import { LandingsService } from "./landings.service";
import { PublicLandingsController } from "./public-landings.controller";

@Module({
  imports: [PrismaModule],
  controllers: [LandingsController, PublicLandingsController],
  providers: [LandingsService],
  exports: [LandingsService],
})
export class LandingsModule {}
