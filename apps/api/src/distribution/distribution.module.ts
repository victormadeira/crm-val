import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { DistributionController } from "./distribution.controller";
import { DistributionService } from "./distribution.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DistributionController],
  providers: [DistributionService],
  exports: [DistributionService],
})
export class DistributionModule {}
