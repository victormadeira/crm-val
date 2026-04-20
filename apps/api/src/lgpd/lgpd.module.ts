import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LgpdController } from "./lgpd.controller";
import { LgpdService } from "./lgpd.service";

@Module({
  imports: [PrismaModule],
  controllers: [LgpdController],
  providers: [LgpdService],
  exports: [LgpdService],
})
export class LgpdModule {}
